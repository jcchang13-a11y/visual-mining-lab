package tw.guixu.underground;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;

public class MainActivity extends Activity {
    private static final String START_URL = "https://jcchang13-a11y.github.io/visual-mining-lab/immortalia/underground/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri uri = Uri.parse(START_URL);
        try {
            CustomTabColorSchemeParams params = new CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(0xFF171817)
                    .setNavigationBarColor(0xFF171817)
                    .build();

            CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                    .setDefaultColorSchemeParams(params)
                    .setShowTitle(false)
                    .build();

            customTabsIntent.launchUrl(this, uri);
        } catch (Exception e) {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, uri);
            startActivity(browserIntent);
        }

        // This activity is only a launcher. Do not leave an empty screen behind
        // after Chrome/Custom Tabs opens or when the user returns from it.
        finish();
    }
}
