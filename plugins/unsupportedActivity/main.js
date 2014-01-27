var templates = [
    "root/externallib/text!root/plugins/unsupportedActivity/unsupportedActivity.html"
];

define(templates, function(unsupportedActivityTpl) {
    var plugin = {
        settings: {
            name: "unsupportedActivity",
            type: "user",
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

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.unsupportedActivity.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:$(document).innerWidth(),
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.unsupportedActivity.sizes = {
                    withSideBar: {
                        center:0,
                        left:0
                    },
                    withoutSideBar: {
                        center:"100%",
                        left:0
                    }
                };
            }
        },

        resize: function() {
            if (MM.plugins.unsupportedActivity.sizes == undefined) {
                MM.plugins.unsupportedActivity._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.unsupportedActivity.sizes.withSideBar.center,
                    'left':MM.plugins.unsupportedActivity.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.unsupportedActivity.sizes.withoutSideBar.center,
                    'left':MM.plugins.unsupportedActivity.sizes.withoutSideBar.left
                });
            }

            if (MM.deviceType === "phone") {
                $("#panel-center").css({
                    'width':'100%',
                    'left':0
                });
            }

            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },
        unsupportedActivity: function(courseID, courseModuleID) {
            MM.panels.showLoading("center");
            var courseModule = MM.db.get("courseModules", courseModuleID);
            var template = MM.plugins.unsupportedActivity.templates.unsupportedActivity;
            var context = { courseID: courseID, courseModule: courseModule };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
            MM.util.setupBackButton();
            $(document).find("#continue").on(
                'click', MM.plugins.unsupportedActivity._showInPopup
            );
        },
        _showInPopup: function(e) {
            var link = $(e.target);
            var url = link.data('url');
            window.open(url);

            return false;
        }
    }

    MM.registerPlugin(plugin);
});
