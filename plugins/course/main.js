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

        course: function(courseID) {
            MM.panels.showLoading("center");
            var method = "core_course_get_courses",
            var data = { options: { ids: [courseID] } },
            var callback = MM.plugins.course.courseInfoCallback,
            var presets = { omitExpires: true, cache: false },
            var errorCallback = MM.plugins.course.errorCallback
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        courseInfoCallback: function(response) {
            var courseInfo = response[0]; 
            MM.plugins.course.currentCourseInfo = response[0]; 
            var method= "core_course_get_contents",
            var data = { courseid: courseInfo.id },
            var callback = MM.plugins.course.courseContentsCallback,
            var presets = { omitExpires: true, cache: false },
            var errorCallback = MM.plugins.course.errorCallback
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },
        
        courseContentsCallback: function(response) {
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
