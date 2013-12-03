var templates = [
    "root/externallib/text!root/plugins/scorm/scorm.html",
    "root/externallib/text!root/plugins/scorm/scorm_launch.html",
    "root/externallib/text!root/plugins/scorm/scorm_launch_preview.html",
];

define(templates, function(scormTpl, scormLaunchTpl, scormLaunchPreviewTpl) {
    var plugin = {
        settings: {
            name: "scorm",
            type: "general",
            lang: {
                component: "core"
            }
        },

        templates: {
            scorm: { html: scormTpl },
            scormLaunch: { html: scormLaunchTpl },
            scormLaunchPreview: { html: scormLaunchPreviewTpl },
        },

        routes: [,
            ["scorm/:cmid", "scorm", "scorm"],
            ["scorm/:cmid/launch", "scormLaunch", "scormLaunch"],
            ["scorm/:cmid/launch-preview", "scormLaunchPreview", "scormLaunchPreview"],
        ],

        currentCourseInfo: null,

        scorm: function(cmid) {
            MM.panels.showLoading("center");
            /* To do: web service call
            var method = "core_course_get_courses";
            var data = { options: { ids: [courseID] } };
            var callback = MM.plugins.course.courseCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.course.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
            */
            MM.plugins.scorm.scormCallback({
                num_attempts_allowed: 'Unlimited',
                num_attempts_made: '0', 
                grading_method: 'Highest attempt', 
                grade_reported: 'None'
            });
        },

        scormCallback: function(response) {
            var scorm = response;
            var template = MM.plugins.scorm.templates.scorm;
            var context = { scorm: scorm };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
            $("#scorm-form").submit(MM.plugins.scorm.scormFormSubmitHandler);
        },

        scormFormSubmitHandler: function(ev) {
            ev.preventDefault();
            var mode = $(this).find("input[name='mode']:checked").val();
            var url = window.location.href + "/launch";
            if (mode === "preview") url += "-preview";
            window.location.href = url; 
        },

        scormLaunch: function(cmid) {
            MM.panels.showLoading("center");
            var template = MM.plugins.scorm.templates.scormLaunch;
            var context = {cmid: cmid};
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
        },

        scormLaunchPreview: function(cmid) {
            MM.panels.showLoading("center");
            var template = MM.plugins.scorm.templates.scormLaunchPreview;
            var context = {cmid: cmid};
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
        },

        errorCallback: function(error) {
            MM.log(error);
        }
    }

    MM.registerPlugin(plugin);
});
