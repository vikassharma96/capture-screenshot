package com.capturescreenshot.capture;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Handler;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.module.annotations.ReactModule;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;

@ReactModule(name = ScreenshotModule.NAME)
public class ScreenshotModule extends ReactContextBaseJavaModule {

    public static final String NAME = "Screenshot";
    private static final String TAG = "ScreenshotModule Error";
    private static final int REQUEST_CODE = 100;

    private ReactApplicationContext reactContext;
    private Promise screenshotPromise;

    private Activity currentActivity;
    private MediaProjection mMediaProjection;
    private MediaProjectionManager mMediaProjectionManager;

    private int mResultCode;
    private Intent mResultData;

    private ImageReader mImageReader;
    private VirtualDisplay mVirtualDisplay;
    private int mDensity;
    private int mWidth;
    private int mHeight;
    private static final String SCREENCAP_NAME = "screencap";
    private static int IMAGES_PRODUCED;
    private Handler mHandler;

    public static int screenshotInterval;

    public static String mStoreDir;

    public ScreenshotModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.currentActivity = reactContext.getCurrentActivity();

        // add listeners
        // reactContext.addLifecycleEventListener(mActivityListener);
        reactContext.addActivityEventListener(mActivityEventListener);

        mMediaProjectionManager =
                (MediaProjectionManager) reactContext.getApplicationContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);
    }

    private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
            if (requestCode == REQUEST_CODE) {
                if (screenshotPromise != null) {
                    if (resultCode == Activity.RESULT_CANCELED) {
                        screenshotPromise.reject(TAG, "Permission Denied");
                    } else if (resultCode == Activity.RESULT_OK) {
                        mResultCode = resultCode;
                        mResultData = intent;
                        setUpMediaProjection();
                        createVirtualDisplay();
                    }
                }
            }
        }
    };

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void captureScreenshot(int delay, final Promise promise) {
        init(delay);
        screenshotPromise = promise;
        try {
            if (mMediaProjection != null) {
                createVirtualDisplay();
            } else if (mResultCode != 0 && mResultData != null) {
                setUpMediaProjection();
                createVirtualDisplay();
            } else {
                currentActivity.startActivityForResult(mMediaProjectionManager.createScreenCaptureIntent(), REQUEST_CODE);
            }
        } catch (Exception exception) {
            if (mVirtualDisplay == null) {
                return;
            }
            mVirtualDisplay.release();
            mVirtualDisplay = null;
            screenshotPromise.reject(TAG, exception);
            screenshotPromise = null;
        }
    }

    public void init(int delay) {
        if (currentActivity == null) {
            currentActivity = reactContext.getCurrentActivity();
        }
        if (mStoreDir == null) {
            File externalFilesDir = reactContext.getExternalFilesDir(null);
            if (externalFilesDir != null) {
                mStoreDir = externalFilesDir.getAbsolutePath() + "/screenshots/";
                File storeDirectory = new File(mStoreDir);
                if (!storeDirectory.exists()) {
                    boolean success = storeDirectory.mkdirs();
                    if (!success) {
                        screenshotPromise.reject(TAG, "failed to create file storage directory.");
                    }
                }
            } else {
                screenshotPromise.reject(TAG, "failed to create file storage directory.");
            }
        }
        screenshotInterval = delay;
    }

    private void setUpMediaProjection() {
        mMediaProjection = mMediaProjectionManager.getMediaProjection(mResultCode, mResultData);
    }

    @SuppressLint("WrongConstant")
    private void createVirtualDisplay() {
        // display metrics
        mDensity = Resources.getSystem().getDisplayMetrics().densityDpi;

        // get width and height
        mWidth = Resources.getSystem().getDisplayMetrics().widthPixels;
        mHeight = Resources.getSystem().getDisplayMetrics().heightPixels;

        // start capture reader
        mImageReader = ImageReader.newInstance(mWidth, mHeight, PixelFormat.RGBA_8888, 2);
        mVirtualDisplay = mMediaProjection.createVirtualDisplay(SCREENCAP_NAME, mWidth, mHeight,
                mDensity, getVirtualDisplayFlags(), mImageReader.getSurface(), null, null);
        mImageReader.setOnImageAvailableListener(new ScreenshotModule.ImageAvailableListener(), null);
    }


    private static int getVirtualDisplayFlags() {
        return DisplayManager.VIRTUAL_DISPLAY_FLAG_OWN_CONTENT_ONLY | DisplayManager.VIRTUAL_DISPLAY_FLAG_PUBLIC;
    }

    private class ImageAvailableListener implements ImageReader.OnImageAvailableListener {
        @Override
        public void onImageAvailable(ImageReader reader) {
            Handler handler = new Handler();
            handler.postDelayed(() -> {
                FileOutputStream fos = null;
                Bitmap bitmap = null;
                try (Image image = mImageReader.acquireLatestImage()) {
                    if (image != null) {
                        Image.Plane[] planes = image.getPlanes();
                        ByteBuffer buffer = planes[0].getBuffer();
                        int pixelStride = planes[0].getPixelStride();
                        int rowStride = planes[0].getRowStride();
                        int rowPadding = rowStride - pixelStride * mWidth;

                        // create bitmap
                        bitmap = Bitmap.createBitmap(mWidth + rowPadding / pixelStride, mHeight, Bitmap.Config.ARGB_8888);
                        bitmap.copyPixelsFromBuffer(buffer);

                        // write bitmap to a file
                        File file = new File(mStoreDir + "/myscreen_" + IMAGES_PRODUCED + ".enc");
                        Log.e("filepath", file.getAbsolutePath());
                        fos = new FileOutputStream(file);
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, fos);
                        IMAGES_PRODUCED++;
                        Log.e(TAG, "captured image: " + IMAGES_PRODUCED);
                        // bitmap to base64
                        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, byteArrayOutputStream);
                        byte[] bytes = byteArrayOutputStream.toByteArray();
                        String base64 = Base64.encodeToString(bytes, Base64.DEFAULT);
                        WritableArray array = new WritableNativeArray();
                        array.pushString(file.getAbsolutePath());
                        array.pushString(base64);
                        screenshotPromise.resolve(array);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    screenshotPromise.reject(e);
                } finally {
                    if (fos != null) {
                        try {
                            fos.close();
                        } catch (IOException ioe) {
                            ioe.printStackTrace();
                        }
                    }

                    if (bitmap != null) {
                        bitmap.recycle();
                    }

                }
            }, screenshotInterval);
        }
    }

    @ReactMethod
    public void stopCapturing(final Promise promise) {
        if (mVirtualDisplay == null) {
            return;
        }
        mMediaProjection = null;
        mVirtualDisplay.release();
        mVirtualDisplay = null;
        promise.resolve("capture stopped...");
    }
}
