/**
 * Thin wrapper around plugins dealing wanting to be the main homepage.
 * All homepage plugins should implement the functions listed here.
 */
MM.homepage = {
    current:undefined,

    // There can only ever be one homepage as specified in config.json, so
    // this init function need only care about that plugin.
    init:function() {
        var homepagePlugin = MM.getConfig('homepage');
        MM.homepage.current = MM.plugins[homepagePlugin];

        // Just incase there's anything that the homepage needs to do.
        // A/B testing sites and similar would be set up by the homepage plugin
        // not as a fundamental part of the system.
        MM.homepage.current.init();
        MM.homepage.show();
    },

    show:function() {
        MM.homepage.current.main();
    },

    loadSuccess:function(response) {
        MM.homepage.current.loadSuccess(response);
    },

    loadFailure:function(xhr, statusText) {
        MM.homepage.current.loadFailure(xhr, statusText);
    }
}