var templates = [
    "root/externallib/text!root/plugins/mycourses/mycourses.html"
];

define(templates, function(myCoursesTpl, participantsTpl, participantTpl) {
    var plugin = {
        settings: {
            name: "mycourses",
            type: "general",
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

        myCourses: function() {
            MM.panels.showLoading("center");
            MM.moodleWSCall(
                method = "core_enrol_get_users_course_completions",
                data = { userid: MM.site.get("userid") },
                callback = MM.plugins.mycourses.myCoursesCallback, 
                preSets = { omitExpires: true, cache: false },
                errorCallBack = MM.plugins.mycourses.errorCallback
            );
        },

        myCoursesCallback: function(response) {
            var courses = response;
            var template = MM.plugins.mycourses.templates.myCourses;
            var context = { courses: courses };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
        },

        errorCallback: function(error) {
            console.log("ERROR");
            console.log(error);    
        }
    }

    MM.registerPlugin(plugin);
});
