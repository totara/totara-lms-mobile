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
            ["programs/:programID/courses/:courseID", "programcourse", "programcourse"],
            ["courses/:courseID", "course", "course"]
        ],

		storage: {
            courseModule: {type: "model"},
            courseModules: {type: "collection", model: "courseModule"}
        },

        currentCourseInfo: null,
        currentCourseID: null,
        currentProgramID: null,

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
                MM.plugins.course.sizes = {
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

        programcourse: function(programID, courseID) {
            MM.Router.navigate("programs/" + programID + "/courses/" + courseID);
            MM.plugins.course.courseInner(courseID, programID);
        },

        course: function(courseID) {
            MM.Router.navigate("courses/" + courseID);
            MM.plugins.course.courseInner(courseID);
        },

        courseInner: function(courseID, programID) {
            MM.plugins.course.currentCourseID = courseID;
            MM.plugins.course.currentProgramID = programID;
            MM.assignCurrentPlugin(MM.plugins.course);
            MM.panels.showLoading("center");
            MM.plugins.course.currentCourseInfo = MM.db.get("courses", MM.plugins.course.currentCourseID);
            if (MM.plugins.course.currentCourseInfo) {
                MM.plugins.course.courseCallback();
            } else {
                MM.moodleWSCall(
                    'core_list_courses',
                    {'options': {'ids': [MM.plugins.course.currentCourseID]}},
                    MM.plugins.course.courseCallback,
                    {'cache':false},
                    MM.plugins.course.errorCallback
                );
            }
        },

        courseCallback: function(response) {
            if (typeof(response) !== 'undefined') {
                _.each(response, function(course) {
                    MM.db.insert('courses', course);
                });
                MM.plugins.course.currentCourseInfo = MM.db.get("courses", MM.plugins.course.currentCourseID);
            }
            var method= "core_course_get_contents";
            var data = {
                courseid: MM.plugins.course.currentCourseID,
                options: [
                    {name: 'userid', value: MM.site.get("userid")},
                    {name: 'forcedescription', value: 'true'},
                    {name: 'uncached', value: 'true'}
                ]
            };
            if (MM.plugins.course.currentProgramID) {
                data['options'].push({
                    name: 'programid',
                    value: MM.plugins.course.currentProgramID
                });
            }
            var callback = MM.plugins.course.courseContentsCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.course.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        courseContentsCallback: function(response) {
            MM.assignCurrentPlugin(MM.plugins.course);
            var course = MM.plugins.course.currentCourseInfo;
            course.contents = response;
            course.num_modules = 0;
            course.num_modules_completed = 0;
			$.each(course.contents, function(i, section) {
                $.each(section.modules, function(j, module) {
                    MM.db.insert("courseModules", module);
                    course.num_modules++;
                    if (module.completed) {
                        course.num_modules_completed++;
                    }
                });
            });
            var template = MM.plugins.course.templates.course;
            var context = { course: course };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
			MM.util.setupAccordion($("#panel-center"));
            MM.util.setupBackButton();
            $("#panel-center .set-activity-completion").change(
                MM.plugins.course.setActivityCompletionHandler
            );
        },

        setActivityCompletionHandler: function(ev) {
            ev.preventDefault();
            var cmid = $(this).attr("data-cmid");
            var completed = $(this).is(":checked") ? 1 : 0;
            var method = "core_course_set_activity_completion";
            var data = {
                cmid: cmid,
                userid: MM.site.get("userid"),
                completed: completed,
                createcoursecomp: 1
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
