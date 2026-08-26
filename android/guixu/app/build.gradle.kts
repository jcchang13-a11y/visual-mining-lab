plugins {
    id("com.android.application")
}

android {
    namespace = "tw.guixu.underground"
    compileSdk = 35

    defaultConfig {
        applicationId = "tw.guixu.underground"
        minSdk = 23
        targetSdk = 35
        versionCode = 3
        versionName = "0.3"
    }
}

dependencies {
    implementation("androidx.browser:browser:1.8.0")
}
