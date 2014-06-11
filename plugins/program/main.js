var templates = [
    "root/externallib/text!root/plugins/program/program.html"
];

define(templates, function(programTpl) {
    var plugin = {
        settings: {
            name: "program",
            type: "user",
            title: "",
            icon: "",
            lang: {
                component: "core"
            }
        },

        templates: {
            program: { html: programTpl }
        },

        routes: [,
            ["programs/:programID", "program", "program"]
        ],

		storage: {
            programModule: {type: "model"},
            programModules: {type: "collection", model: "programModule"}
        },

        programData: null,

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.program.sizes = {
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
                MM.plugins.program.sizes = {
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
            if (MM.plugins.program.sizes == undefined) {
                MM.plugins.program._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.program.sizes.withSideBar.center,
                    'left':MM.plugins.program.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.program.sizes.withoutSideBar.center,
                    'left':MM.plugins.program.sizes.withoutSideBar.left
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

        program: function(programID) {
            var method = "totara_program_get_program";
            var data = { programid: programID, userid: MM.site.get("userid") };
            var callback = MM.plugins.program.programCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.program.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        programCallback: function(response) {
            MM.plugins.program.programData = response;
            var method = "moodle_enrol_get_users_courses";
            var data = { userid: MM.site.get("userid") };
            var callback = MM.plugins.program.coursesCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.program.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        coursesCallback: function(response) {
            var enrolledCourses = response;
            var enrolledCourseIds = _.map(enrolledCourses, function(course) {
                return course.id;
            });
            _.each(MM.plugins.program.programData.sets, function(set) {
                _.each(set.courses, function(course) {
                    course.enrolled = _.contains(enrolledCourseIds, course.id);
                });
            });
            var html = MM.tpl.render(
                MM.plugins.program.templates.program.html, 
                {'program': MM.plugins.program.programData}
            );
            MM.panels.show("center", html);
            MM.util.setupAccordion($("#panel-center"));
            MM.util.setupBackButton();
        },

        errorCallback: function(error) {
            MM.log(error);
        }
    }

    MM.registerPlugin(plugin);
});
