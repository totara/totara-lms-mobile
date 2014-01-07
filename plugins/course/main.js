var templates = [
    "root/externallib/text!root/plugins/course/course.html"
];

define(templates, function(courseTpl) {
    var plugin = {
        settings: {
            name: "course",
            type: "user",
            title: "",
            icon: "",
            lang: {
                component: "core"
            }
        },

        templates: {
            course: { html: courseTpl }
        },

        routes: [,
            ["courses/:courseID", "course", "course"]
        ],

		storage: {
            courseModule: {type: "model"},
            courseModules: {type: "collection", model: "courseModule"}
        },

        currentCourseInfo: null,

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.course.sizes = {
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
            if (MM.plugins.course.sizes == undefined) {
                MM.plugins.course._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.course.sizes.withSideBar.center,
                    'left':MM.plugins.course.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.course.sizes.withoutSideBar.center,
                    'left':MM.plugins.course.sizes.withoutSideBar.left
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

        course: function(courseID) {
            MM.Router.navigate("courses/" + courseID);
            MM.assignCurrentPlugin(MM.plugins.course);
            MM.panels.showLoading("center");
            var method = "core_course_get_courses";
            var data = { options: { ids: [courseID] } };
            var callback = MM.plugins.course.courseInfoCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.course.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        courseInfoCallback: function(response) {
            var courseInfo = response[0];
            MM.plugins.course.currentCourseInfo = response[0];
            var method= "core_course_get_contents";
            var data = { courseid: courseInfo.id };
            var callback = MM.plugins.course.courseContentsCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.course.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        courseContentsCallback: function(response) {
            MM.assignCurrentPlugin(MM.plugins.course);
            var course = MM.plugins.course.currentCourseInfo;
            course.contents = response;
			$.each(course.contents, function(i, section) {
                $.each(section.modules, function(j, module) {
                    MM.db.insert("courseModules", module);
                });
            });
            var template = MM.plugins.course.templates.course;
            var context = { course: course };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
			MM.util.setupAccordion($("#panel-center"));
            MM.util.setupBackButton();
            $("#panel-center .set-activity-completion").change(MM.plugins.course.setActivityCompletionHandler);
        },

        setActivityCompletionHandler: function(ev) {
            ev.preventDefault();
            var cmid = $(this).attr("data-cmid");
            var completed = $(this).is(":checked") ? 1 : 0;
            var method = "core_course_set_activity_completion";
            var data = {
                cmid: cmid,
                userid: MM.site.get("userid"),
                completed: completed
            };
            var callback = function() {};
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.course.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        errorCallback: function(error) {
            MM.log(error);
        }
    }

    MM.registerPlugin(plugin);
});
