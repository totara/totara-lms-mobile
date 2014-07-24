var templates = [
    "root/externallib/text!root/plugins/mybookings/layout.html"
];

define(templates, function(layoutTpl) {
    var plugin = {
        settings: {
            name: "mybookings",
            type: "general",
            title: "My Bookings",
            icon: "img/totara/icon/my-bookings.png",
            alticon: "img/totara/icon/my-bookings-grey.png",
            lang: {
                component: "core"
            },
            menuURL: "#my-bookings"
        },

        templates: {
            layout:layoutTpl
        },

        routes: [
            ["my-bookings", "main", "main"]
        ],

        sizes: undefined,

        _getSizes: function() {

            // Default tablet.
            MM.plugins.mybookings.sizes = {
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
                MM.plugins.mybookings.sizes = {
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
            if (MM.plugins.mybookings.sizes == undefined) {
                MM.plugins.mybookings._getSizes();
            }

            if (MM.deviceType === "tablet") {
                if (MM.navigation.visible === true) {
                    $("#panel-center").css({
                        'width':MM.plugins.mybookings.sizes.withSideBar.center,
                        'left':MM.plugins.mybookings.sizes.withSideBar.left
                    });
                } else {
                    $("#panel-center").css({
                        'width':MM.plugins.mybookings.sizes.withoutSideBar.center,
                        'left':MM.plugins.mybookings.sizes.withoutSideBar.left
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
            var method = "totara_my_get_bookings";
            var data = {
                'userid': MM.site.get("userid"),
                'options': [
                    {'name': 'markseenonmobile', 'value': true},
                ]
            }
            var callback = MM.plugins.mybookings._getBookingsSuccess;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.mybookings._getBookingsFailure;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        _getBookingsSuccess: function(data) {
            $("#menu-items-new-mybookings").css('visibility', 'hidden');
            $("#top-menu-items-new-mybookings").css('visibility', 'hidden');
            var bookings = [];
            _.each(data, function(booking) {
                // Sorted index only returns where the value *would* go.
                var insertIndex = _.sortedIndex(bookings, booking, 'timestart');

                // We still actually have to insert it.
                bookings.splice(insertIndex, 0, booking);
            });

            var values = {
                'bookings':bookings,
                'title': MM.plugins.mybookings.settings.title
            };

            var html = MM.tpl.render(
                MM.plugins.mybookings.templates.layout, values, {}
            );
            MM.panels.show('center', html, {hideRight: true});
            MM.util.setupAccordion($("#panel-center"));
        },

        _getBookingsFailure: function() {

        },

        main: function() {
            MM.panels.showLoading("center");
            MM.assignCurrentPlugin(MM.plugins.mybookings);
            MM.plugins.mybookings._getBookings();
        }
    }

    MM.registerPlugin(plugin);
});
