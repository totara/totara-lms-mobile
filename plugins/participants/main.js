var templates = [
    "root/externallib/text!root/plugins/participants/participants.html",
    "root/externallib/text!root/plugins/participants/participant.html"
];

define(templates,function (participantsTpl, participantTpl) {
    var plugin = {
        settings: {
            name: "participants",
            type: "course",
            menuURL: "#participants/",
            lang: {
                component: "core"
            },
            icon: ""
        },

        storage: {
            participant: {type: "model"},
            participants: {type: "collection", model: "participant"}
        },

        routes: [
            ["participants/:courseId", "participants", "showParticipants"],
            ["participant/:courseId/:userId", "participants", "showParticipant"],
        ],

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.participants.sizes = {
                withSideBar: {
                    left:MM.navigation.getWidth(),
                    center:($(document).innerWidth() - MM.navigation.getWidth())/2,
                    right:($(document).innerWidth() - MM.navigation.getWidth())/2
                },
                withoutSideBar: {
                    left:0,
                    center:$(document).innerWidth() / 2,
                    right:$(document).innerWidth() / 2
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
            if (MM.plugins.participants.sizes == undefined) {
                MM.plugins.participants._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.participants.sizes.withSideBar.center,
                    'left':MM.plugins.participants.sizes.withSideBar.left
                });
                $("#panel-right").css({
                    'width':MM.plugins.participants.sizes.withSideBar.right,
                    'left':MM.plugins.participants.sizes.withSideBar.center + MM.navigation.getWidth()
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.participants.sizes.withoutSideBar.center,
                    'left':MM.plugins.participants.sizes.withoutSideBar.left
                });
                $("#panel-right").css({
                    'width':MM.plugins.participants.sizes.withoutSideBar.right,
                    'left':MM.plugins.participants.sizes.withoutSideBar.center
                });
            }

            if (MM.deviceType === "phone") {
                $("#panel-center").css({
                    'width':'100%',
                    'left':0
                });
            }

            $("#panel-right").show();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        showParticipants: function(courseId) {
            MM.assignCurrentPlugin(MM.plugins.participants);

            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }
            // Adding loading icon.
            $('a[href="#participants/' + courseId + '"]').addClass('loading-row');

            var data = {
                "courseid" : courseId
            };

            MM.moodleWSCall('moodle_user_get_users_by_courseid', data, function(users) {
                // Removing loading icon.
                $('a[href="#participants/' +courseId+ '"]').removeClass('loading-row');
                var tpl = {users: users, deviceType: MM.deviceType, courseId: courseId};
                var html = MM.tpl.render(MM.plugins.participants.templates.participants.html, tpl);

                var course = MM.db.get("courses", parseInt(courseId, 10));
                var pageTitle = course.get("shortname") + " - " + MM.lang.s("participants");

                MM.panels.show('center', html, {title: pageTitle});
                // Load the first user
                if (MM.deviceType == "tablet" && users.length > 0) {
                    $("#panel-center li:eq(0)").addClass("selected-row");
                    MM.plugins.participants.showParticipant(courseId, users.shift().id);
                    $("#panel-center li:eq(0)").addClass("selected-row");
                }
            }, null, function(m) {
                // Removing loading icon.
                $('a[href="#participants/' +courseId+ '"]').removeClass('loading-row');
            });
        },

        showParticipant: function(courseId, userId) {
            MM.assignCurrentPlugin(MM.plugins.participants);

            var data = {
                "userlist[0][userid]": userId,
                "userlist[0][courseid]": courseId
            }
            MM.moodleWSCall('moodle_user_get_course_participants_by_id', data, function(users) {
                // Load the active user plugins.

                var userPlugins = [];
                for (var el in MM.plugins) {
                    var plugin = MM.plugins[el];
                    if (plugin.settings.type == "user") {
                        userPlugins.push(plugin.settings);
                    }
                }

                var newUser = users.shift();

                var course = MM.db.get("courses", courseId);
                var pageTitle = course.get("shortname") + " - " + MM.lang.s("participants");

                var tpl = {"user": newUser, "plugins": userPlugins, "courseid": courseId};
                var html = MM.tpl.render(MM.plugins.participants.templates.participant.html, tpl);

                MM.db.insert("users", newUser);
                MM.panels.show('right', html, {title: pageTitle});
            });
        },


        templates: {
            "participant": {
                model: "participant",
                html: participantTpl
            },
            "participants": {
                html: participantsTpl
            }
        }
    }

    MM.registerPlugin(plugin);
});
