var templates = [
    "root/externallib/text!root/plugins/mylearning/layout.html"
];

define(templates, function(layoutTpl) {
    var plugin = {
        settings: {
            name: "mylearning",
            type: "user",
            lang: {
                component: "core"
            },
            menuURL: "#mylearning"
        },

        templates: {
            layout:layoutTpl
        },

        routes: [
            ["#mylearning", "main", "main"]
        ],

        sizes: undefined,

        _getSizes: function() {

            // Default tablet.
            MM.plugins.mylearning.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:"100%",
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.mylearning.sizes = {
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
            if (MM.plugins.mylearning.sizes == undefined) {
                MM.plugins.mylearning._getSizes();
            }

            if (MM.deviceType === "tablet") {
                if (MM.navigation.visible === true) {
                    $("#panel-center").css({
                        'width':MM.plugins.mylearning.sizes.withSideBar.center,
                        'left':MM.plugins.mylearning.sizes.withSideBar.left
                    });
                } else {
                    $("#panel-center").css({
                        'width':MM.plugins.mylearning.sizes.withoutSideBar.center,
                        'left':MM.plugins.mylearning.sizes.withoutSideBar.left
                    });
                }
            } else if (MM.deviceType === "phone") {
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

        _getBookings: function() {
            var method = "";
            var data = {};
            var callback = MM.plugins.mylearning._getBookingsSuccess;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.mylearning._getBookingsFailure;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        _getBookingsSuccess: function(data) {
            var values = {
                'courses':data
            };
            var html = MM.tpl.render(
                MM.plugins.mylearning.templates.layout, values, {}
            );
            MM.panels.show('center', html, {hideRight: true});
            MM.util.setupAccordion($("#panel-center"));
            MM.util.setupBackButton();
        },

        _getBookingsFailure: function() {

        },

        main: function() {
            MM.assignCurrentPlugin(MM.plugins.mylearning);
            MM.panels.showLoading("center");

            // Put your code here
            MM.plugins.mylearning._getBookings();
        }
    }

    MM.registerPlugin(plugin);
});