var templates = [
    "root/externallib/text!root/plugins/label/label.html"
];

define(templates, function(labelTpl) {
    var plugin = {
        settings: {
            name: "label",
            type: "user",
            lang: {
                component: "core"
            },
            menuURL: "#"
        },

        templates: {
            label: { html: labelTpl }
        },

        routes: [
            ["label/:cmid", "label", "label"]
        ],

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.label.sizes = {
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
                MM.plugins.mycourses.sizes = {
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
            if (MM.plugins.label.sizes == undefined) {
                MM.plugins.label._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.label.sizes.withSideBar.center,
                    'left':MM.plugins.label.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.label.sizes.withoutSideBar.center,
                    'left':MM.plugins.label.sizes.withoutSideBar.left
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

        label: function(cmid) {
            MM.assignCurrentPlugin(MM.plugins.label);
            console.log("LABEL");
            MM.panels.showLoading("center");
            var method= "mod_label_get_label_details";
            var data = { cmid: cmid };
            var callback = MM.plugins.label.labelDetailsCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.course.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        labelDetailsCallback: function(response) {
            console.log("CALLBACK");
            var label = response;
            var template = MM.plugins.label.templates.label;
            var context = { label: label};
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
            MM.util.setupBackButton();
        }
        
    }

    MM.registerPlugin(plugin);
});
