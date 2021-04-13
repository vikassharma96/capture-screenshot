package com.capturescreenshot.capture;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = ScreenshotModule.NAME)
public class ScreenshotModule extends ReactContextBaseJavaModule {

  public static final String NAME = "Screenshot";
  private static final String TAG = "ScreenCaptureService";
  private static final int REQUEST_CODE = 100;

  private ReactApplicationContext reactContext;
  private Promise screenshotPromise;


  public ScreenshotModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    // add listeners
    // reactContext.addLifecycleEventListener(mActivityListener);
    reactContext.addActivityEventListener(mActivityEventListener);
  }

  private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
      if (requestCode == REQUEST_CODE) {
        if (screenshotPromise != null) {
          if (resultCode == Activity.RESULT_CANCELED) {
            screenshotPromise.reject("Error", "Permission Denied");
          } else if (resultCode == Activity.RESULT_OK) {
            reactContext.startService(ScreenCaptureService.getStartIntent(reactContext, resultCode, intent));
          }
          screenshotPromise = null;
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
  public void captureScreenshot(final Promise promise) {
    Activity currentActivity = getCurrentActivity();
    if (currentActivity == null) {
      promise.reject("Error", "Activity doesn't exist");
      return;
    }
    screenshotPromise = promise;
    try{
      MediaProjectionManager mProjectionManager =
        (MediaProjectionManager) reactContext.getApplicationContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);
      currentActivity.startActivityForResult(mProjectionManager.createScreenCaptureIntent(), REQUEST_CODE);
    } catch (Exception e) {
      screenshotPromise.reject("Error", e);
      screenshotPromise = null;
    }
  }

  @ReactMethod
  public void stopCapturing(final Promise promise) {
    reactContext.startService(ScreenCaptureService.getStopIntent(reactContext));
    promise.resolve(null);
  }

  @ReactMethod
  public void isRunning(final Promise promise) {
    promise.resolve(ScreenCaptureService.isRunning);
  }
}
