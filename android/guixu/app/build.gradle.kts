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
        versionCode = 2
        versionName = "0.2"
    }
}

dependencies {
    implementation("androidx.browser:browser:1.8.0")
}
