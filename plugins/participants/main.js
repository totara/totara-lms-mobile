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
            title: "Participants",
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

        templates: {
            "participant": {
                model: "participant",
                html: participantTpl
            },
            "participants": {
                html: participantsTpl
            }
        },

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.participants.sizes = {
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
                MM.plugins.participants.sizes = {
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
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.participants.sizes.withoutSideBar.center,
                    'left':MM.plugins.participants.sizes.withoutSideBar.left
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

        _getUsersByCourseId: function(courseId) {
            var data = {
                "courseid" : courseId
            };
            MM.moodleWSCall('moodle_user_get_users_by_courseid', data, function(users) {
                // Removing loading icon.
                $('a[href="#participants/' + courseId + '"]').removeClass('loading-row');
                var tpl = {
                    users: users,
                    deviceType: MM.deviceType,
                    courseId: courseId,
                    title: MM.plugins.participants.settings.title
                };
                var html = MM.tpl.render(
                    MM.plugins.participants.templates.participants.html, tpl
                );

                var course = MM.db.get("courses", parseInt(courseId, 10));
                var pageTitle = course.get("shortname") + " - " + MM.lang.s("participants");

                MM.panels.show('center', html, {title: pageTitle});
                MM.util.setupBackButton();
            }, null, function(m) {
                // Removing loading icon.
                $('a[href="#participants/' + courseId + '"]').removeClass('loading-row');
            });
        },

        showParticipants: function(courseId) {
            MM.assignCurrentPlugin(MM.plugins.participants);

            MM.panels.showLoading('center');

            // Adding loading icon.
            $('a[href="#participants/' + courseId + '"]').addClass('loading-row');


            if (MM.db.length("courses") === 0 ||
                MM.db.get("courses", courseId) === undefined
            ) {
                MM.moodleWSCall(
                    'core_course_get_courses',
                    {},
                    function(data) {
                        if (data.length === 0) {
                            MM.plugins.participants._refreshCoursesFailure(
                                "", "No courses returned from web service"
                            );
                        }
                        _.each(data, function(x){
                            MM.db.insert("courses", x);
                        });

                        MM.plugins.participants._getUsersByCourseId(courseId);
                    },
                    {cache:false},
                    MM.plugins.participants._refreshCoursesFailure
                );
            } else {
                MM.plugins.participants._getUsersByCourseId(courseId);
            }
        },

        _refreshCoursesFailure: function(xhr, statusText) {

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
                var wantedPlugins = [
                    "addcontact",
                    "addnote",
                    "sendmessage"
                ];
                for (var el in MM.plugins) {
                    var plugin = MM.plugins[el];
                    if (_.indexOf(wantedPlugins, plugin.settings.name) !== -1) {
                        userPlugins.push(plugin.settings);
                    }
                }

                var newUser = users.shift();

                // It's possible that courses haven't been queried at this point.
                // If that's the case then we query them, so we have the courses
                // stored and then we can use the data to get the page title
                // for the course.
                if (MM.db.length("courses") === 0 ||
                    MM.db.get("courses", courseId) === undefined
                ) {
                    MM.moodleWSCall(
                        'core_course_get_courses',
                        {},
                        function(data){
                            if (data.length === 0) {
                                MM.plugins.participants._refreshCoursesFailure(
                                    "", "No courses returned from web service"
                                );
                            }
                            _.each(data, function(x){
                                MM.db.insert("courses", x);
                            });

                            MM.plugins.participants.showParticipant(courseId, userId)
                        },
                        {cache:false},
                        MM.plugins.participants._refreshCoursesFailure
                    );
                } else {
                    var course = MM.db.get("courses", courseId);
                    var pageTitle = course.get("shortname") + " - " + MM.lang.s("participants");

                    var tpl = {
                        "user": newUser,
                        "plugins": userPlugins,
                        "courseid": courseId
                    };
                    var html = MM.tpl.render(
                        MM.plugins.participants.templates.participant.html, tpl
                    );

                    MM.db.insert("users", newUser);
                    MM.panels.show('center', html, {title: pageTitle});
                    MM.util.setupBackButton();
                }
            });
        }
    }

    MM.registerPlugin(plugin);
});
