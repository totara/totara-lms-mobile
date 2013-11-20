var templates = [
    "root/externallib/text!root/plugins/course/course.html"
];

define(templates, function(courseTpl) {
    var plugin = {
        settings: {
            name: "course",
            type: "general",
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

        currentCourseInfo: null,

        sizes: undefined,

        _getSizes: function() {
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
            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        course: function(courseID) {
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
            var template = MM.plugins.course.templates.course;
            var context = { course: course };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
        },

        errorCallback: function(error) {
            MM.log(error);
        }
    }

    MM.registerPlugin(plugin);
});
