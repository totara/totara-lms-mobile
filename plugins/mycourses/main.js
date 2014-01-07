var templates = [ "root/externallib/text!root/plugins/mycourses/mycourses.html"
];

define(templates, function(myCoursesTpl, participantsTpl, participantTpl) {
    var plugin = {
        settings: {
            name: "mycourses",
            title: "My Courses",
            type: "general",
            icon: "img/icon/my-courses.png",
            lang: {
                component: "core"
            },
            menuURL: "#my-courses",
        },

        templates: {
            myCourses: { html: myCoursesTpl }
        },

        routes: [
            ["my-courses", "myCourses", "myCourses"]
        ],

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.mycourses.sizes = {
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
            if (MM.plugins.mycourses.sizes == undefined) {
                MM.plugins.mycourses._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.mycourses.sizes.withSideBar.center,
                    'left':MM.plugins.mycourses.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.mycourses.sizes.withoutSideBar.center,
                    'left':MM.plugins.mycourses.sizes.withoutSideBar.left
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

        myCourses: function() {
            MM.Router.navigate("my-courses");
            MM.assignCurrentPlugin(MM.plugins.mycourses);
            MM.panels.showLoading("center");
            var method = "core_enrol_get_users_course_completions";
            var data = { userid: MM.site.get("userid") };
            var callback = MM.plugins.mycourses.myCoursesCallback;
            var preSets = { omitExpires: true, cache: false };
            var errorCallBack = MM.plugins.mycourses.errorCallback;
            MM.moodleWSCall(method, data, callback, preSets, errorCallBack);
        },

        myCoursesCallback: function(response) {
            MM.assignCurrentPlugin(MM.plugins.mycourses);
            var courses = response;
            var template = MM.plugins.mycourses.templates.myCourses;
            var context = { courses: courses, title: MM.plugins.mycourses.settings.title };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
            MM.util.setupAccordion($("#panel-center"));
        },

        errorCallback: function(error) {
            MM.log(error);
        }
    }

    MM.registerPlugin(plugin);
});
