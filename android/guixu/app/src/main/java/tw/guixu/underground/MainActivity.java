package tw.guixu.underground;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;

public class MainActivity extends Activity {
    private static final String START_URL = "https://jcchang13-a11y.github.io/visual-mining-lab/immortalia/underground/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        CustomTabColorSchemeParams params = new CustomTabColorSchemeParams.Builder()
                .setToolbarColor(0xFF171817)
                .setNavigationBarColor(0xFF171817)
                .build();

        CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                .setDefaultColorSchemeParams(params)
                .setShowTitle(false)
                .build();

        customTabsIntent.launchUrl(this, Uri.parse(START_URL));
    }
}
