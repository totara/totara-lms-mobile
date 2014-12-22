var templates = [
    "root/externallib/text!root/plugins/page/page.html"
];

define(templates, function(pageTpl) {
    var plugin = {
        settings: {
            name: "page",
            type: "user",
            lang: {
                component: "core"
            },
            menuURL: "#"
        },

        templates: {
            page: { html: pageTpl }
        },

        routes: [
            ["page/:cmid", "page", "page"]
        ],

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.page.sizes = {
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
                MM.plugins.page.sizes = {
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
            if (MM.plugins.page.sizes == undefined) {
                MM.plugins.page._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.page.sizes.withSideBar.center,
                    'left':MM.plugins.page.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.page.sizes.withoutSideBar.center,
                    'left':MM.plugins.page.sizes.withoutSideBar.left
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

        page: function(cmid) {
            MM.assignCurrentPlugin(MM.plugins.page);
            MM.panels.showLoading("center");
            var method= "mod_page_get_page_details";
            var data = { cmid: cmid };
            var callback = MM.plugins.page.pageDetailsCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.course.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        pageDetailsCallback: function(response) {
            var page = response;
            var template = MM.plugins.page.templates.page;
            var context = { page: page};
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
            MM.util.setupBackButton();
            if (page.complete_on_view) {
                var method = "tm_core_course_set_activity_completion";
                var data = {
                    cmid: page.cmid,
                    completed: 1
                };
                var callback = function() {};
                var presets = { omitExpires: true, cache: false };
                var errorCallback = MM.plugins.course.errorCallback;
                MM.moodleWSCall(method, data, callback, presets, errorCallback);
            }
        }

    }

    MM.registerPlugin(plugin);
});
