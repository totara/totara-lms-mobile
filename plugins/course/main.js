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
            MM.moodleWSCall(
                method = "core_course_get_courses",
                data = { options: { ids: [courseID] } },
                callback = MM.plugins.course.courseInfoCallback,
                preSets = { omitExpires: true, cache: false },
                errorCallBack = MM.plugins.course.errorCallback
            );
        },

        courseInfoCallback: function(response) {
            var courseInfo = response[0]; 
            MM.plugins.course.currentCourseInfo = response[0]; 
            MM.moodleWSCall(
                method= "core_course_get_contents",
                data = { courseid: courseInfo.id },
                callback = MM.plugins.course.courseContentsCallback,
                preSets = { omitExpires: true, cache: false },
                errorCallBack = MM.plugins.course.errorCallback
            );
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
