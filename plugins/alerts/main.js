var templates = [
    "root/externallib/text!root/plugins/alerts/layout.html"
];

define(templates, function(layoutTpl) {
    var plugin = {
        settings: {
            name: "alerts",
            type: "general",
            title: "Alerts",
            icon: "img/totara/icon/alerts.png",
            alticon: "img/totara/icon/alerts-grey.png",
            lang: {
                component: "core"
            },
            menuURL: "#alerts"
        },

        templates: {
            layout:layoutTpl
        },

        routes: [
            ["alerts", "main", "main"]
        ],

        sizes: undefined,

        _getSizes: function() {

            // Default tablet.
            MM.plugins.alerts.sizes = {
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
                MM.plugins.alerts.sizes = {
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
            if (MM.plugins.alerts.sizes == undefined) {
                MM.plugins.alerts._getSizes();
            }

            if (MM.deviceType === "tablet") {
                if (MM.navigation.visible === true) {
                    $("#panel-center").css({
                        'width':MM.plugins.alerts.sizes.withSideBar.center,
                        'left':MM.plugins.alerts.sizes.withSideBar.left
                    });
                } else {
                    $("#panel-center").css({
                        'width':MM.plugins.alerts.sizes.withoutSideBar.center,
                        'left':MM.plugins.alerts.sizes.withoutSideBar.left
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

        _getAlerts: function() {
            var method = "totara_message_get_alerts";
            var data = {'userid':MM.site.get("userid") };
            var callback = MM.plugins.alerts._getAlertsSuccess;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.alerts._getAlertsFailure;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        _getAlertsSuccess: function(data) {
            var values = {
                'alerts':data,
                'title':MM.plugins.alerts.settings.title
            };
            var html = MM.tpl.render(
                MM.plugins.alerts.templates.layout, values, {}
            );
            MM.panels.show('center', html, {hideRight: true});
            $(document).find('.alert.dismiss').on(
                MM.clickType, MM.plugins.alerts._dismissAlert
            );
            MM.util.setupAccordion($("#panel-center"));
        },

        _getAlertsFailure: function() {

        },

        _dismissAlert: function(e) {
            var element = $(e.target);
            var messageId = element.data('messageid');
            var method = "totara_message_dismiss_alerts";
            var data = {'messageids':[messageId]};
            var callback = MM.plugins.alerts._dismissAlertSuccess;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.alerts._dismissAlertFailure;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        _dismissAlertSuccess: function(data) {
            $(document).find("li.nav-item[data-messageid=" + data[0] + "]").remove();
        },

        _dismissAlertFailure: function() {

        },

        main: function() {
            MM.resetMenuItemsIndicator(MM.plugins.alerts.name);

            MM.panels.showLoading("center");
            MM.assignCurrentPlugin(MM.plugins.alerts);
            MM.plugins.alerts._getAlerts();
        }
    }

    MM.registerPlugin(plugin);
});
