var templates = [
    "root/externallib/text!root/plugins/unsupportedActivity/unsupportedActivity.html"
];

define(templates, function(unsupportedActivityTpl) {
    var plugin = {
        settings: {
            name: "unsupportedActivity",
            type: "general",
            lang: {
                component: "core"
            }
        },

        templates: {
            unsupportedActivity: { html: unsupportedActivityTpl }
        },

        routes: [,
            [
                "courses/:courseID/unsupported-activity/:courseModuleID", 
                "unsupportedActivity", 
                "unsupportedActivity"
            ]
        ],

        storage: {
            courseModule: {type: "model"},
            courseModules: {type: "collection", model: "courseModule"}
        },

        unsupportedActivity: function(courseID, courseModuleID) {
            MM.panels.showLoading("center");
            var courseModule = MM.db.get("courseModules", courseModuleID);
            var template = MM.plugins.unsupportedActivity.templates.unsupportedActivity;
            var context = { courseID: courseID, courseModule: courseModule };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
        },

    }

    MM.registerPlugin(plugin);
});
