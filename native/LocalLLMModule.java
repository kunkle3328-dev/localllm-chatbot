
package com.neurpulse.localllm;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

public class LocalLLMModule extends ReactContextBaseJavaModule {

  static {
    // Load the compiled Rust library
    System.loadLibrary("mobile_llm_engine");
  }

  public LocalLLMModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "LocalLLM";
  }

  @ReactMethod
  public native void initEngine(String path, int threads);

  @ReactMethod
  public native void generate(String prompt, Callback onToken);

  // Interface for the Rust callback to invoke
  public interface TokenCallback {
    void onToken(String token);
  }
}
