var requires = [
    "root/externallib/text!root/plugins/findcourses/selfEnrolForm.html",
    "root/externallib/text!root/plugins/findcourses/findcourses.html"
];
define(requires, function(selfEnrolForm, coursesTpl) {
    var plugin = {
        settings: {
            name: "findcourses",
            type: "general",
            title: "Find Courses",
            icon: "img/totara/icon/find-courses.png",
            lang: {
                component: "core"
            },
            menuURL: "#find_courses"
        },

        storage: {
            category: {type: "model"},
            categories: {type: "collection", model: "category"}
        },

        routes: [
            ["find_courses", "find_courses", "main"],
            ["find_courses/:subCatId", "sub_category", "main"],
            ["enrol_user/:courseId", "enrol_user", "enrol_user"]
        ],

        templates: {
            "courseEnrolment": {
                html: selfEnrolForm
            },
            "results": {
                html: coursesTpl
            }
        },

        sizes: undefined,

         _getSizes: function() {

            // Default tablet.
            MM.plugins.findcourses.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:"100%",
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.findcourses.sizes = {
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
            if (MM.plugins.findcourses.sizes == undefined) {
                MM.plugins.findcourses._getSizes();
            }

            if (MM.deviceType === "tablet") {
                if (MM.navigation.visible === true) {
                    $("#panel-center").css({
                        'width':MM.plugins.findcourses.sizes.withSideBar.center,
                        'left':MM.plugins.findcourses.sizes.withSideBar.left
                    });
                } else {
                    $("#panel-center").css({
                        'width':MM.plugins.findcourses.sizes.withoutSideBar.center,
                        'left':MM.plugins.findcourses.sizes.withoutSideBar.left
                    });
                }
            } else if (MM.deviceType === "phone") {
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
            MM.plugins.findcourses._removeListeners();
        },

        _removeListeners: function() {
            $(document).off('categories_found');
            $(document).off('course_completions_found');
            $(document).off('courses_found');
        },

        main: function(subCatId) {
            MM.resetMenuItemsIndicator(MM.plugins.findcourses.name);

            if (subCatId === undefined) {
                subCatId = 0;
            }
            MM.plugins.findcourses.showingCategoryId = subCatId;

            $(document).on(
                'categories_found', MM.plugins.findcourses._collateCategoriesAndCourses
            );
            $(document).on(
                'course_completions_found', MM.plugins.findcourses._collateCategoriesAndCourses
            );
            $(document).on(
                'courses_found', MM.plugins.findcourses._getCourseCompletions
            );
            MM.plugins.findcourses._getCategories();
            MM.plugins.findcourses._getCourses();
        },

        _getCourseCompletions: function() {
            var method = 'core_enrol_get_users_course_completions';
            var data = {userid: MM.site.get("userid")};
            var successCallback = MM.plugins.findcourses._getCourseCompletionsSuccess;
            var errorCallback = MM.plugins.findcourses._getCourseCompletionsFailure;
            var preSets = {'cache':false};
            MM.moodleWSCall(method, data, successCallback, preSets, errorCallback);
        },

        _getCourseCompletionsSuccess: function(data) {
            MM.plugins.findcourses.completions = data;
            $(document).trigger('course_completions_found');
        },

        _getCourseCompletionsFailure: function() {

        },

        _getCategories: function() {
            MM.panels.showLoading('center');
            MM.assignCurrentPlugin(MM.plugins.findcourses);
            MM.moodleWSCall(
                'core_course_get_categories',
                {},
                MM.plugins.findcourses._getCategoriesSuccessful,
                {'cache':false},
                MM.plugins.findcourses._getCategoriesFailure
            );
        },

        _getCategoriesSuccessful: function(data) {
            MM.plugins.findcourses.categories = data;
            _.each(data, function(category) {
                MM.db.insert('categories', category);
            });
            $(document).trigger('categories_found');
        },

        _getCategoriesFailure: function() {

        },

        _getCourses: function() {
            MM.moodleWSCall(
                'core_list_courses',
                {},
                MM.plugins.findcourses._getCoursesSuccessful,
                {'cache':false},
                MM.plugins.findcourses._getCoursesFailure
            );
        },

        _getCoursesSuccessful: function(data) {
            MM.plugins.findcourses.courses = data;
            _.each(data, function(course) {
                MM.db.insert('courses', course);
            });
            $(document).trigger('courses_found');
        },

        _getCoursesFailure: function() {

        },

        categories: undefined,
        courses: undefined,
        completions: undefined,

        _collateCategoriesAndCourses: function() {
            if (MM.plugins.findcourses.categories !== undefined &&
                MM.plugins.findcourses.courses !== undefined
            ) {
                MM.plugins.findcourses._removeListeners();
                if (MM.plugins.findcourses.showingCategoryId === 0) {
                    MM.Router.navigate(
                        "find_courses"
                    );
                } else {
                    MM.Router.navigate(
                        "find_courses/" + MM.plugins.findcourses.showingCategoryId
                    );
                }

                // Categories is about to be rewritten so that keys are the
                // id of the category.
                // Courses will be discarded.
                var categories = {};
                var courses = MM.plugins.findcourses.courses;
                _.each(MM.plugins.findcourses.categories, function(category, index) {
                    category.courses = [];
                    category.subcategories = [];
                    category.categoryName = category.name;
                    _.each(courses, function(course, index) {
                        if (course.category === category.id) {
                            // Course completion status.
                            _.each(MM.plugins.findcourses.completions, function(completion) {
                                if (completion.id == course.id) {
                                    course.started = completion.started;
                                    course.completed = completion.completed;
                                }
                            });
                            category.courses.push(course);
                        }
                    });
                    categories[category.id] = category;
                });

                // Run through the categories setting up the sub categories for
                // each.
                _.each(categories, function(category, categoryId) {
                    if (category.parent !== 0) {
                        categories[category.parent].subcategories.push(categoryId);
                    }
                });

                // NOTE: At this point we have an object of categories (indexed by
                //       category id) that contain a 1D array of subcategories and
                //       a 1D array of courses.
                var title = MM.plugins.findcourses.settings.title;
                if (MM.plugins.findcourses.showingCategoryId !== 0) {
                    title += ' within ' + categories[
                        MM.plugins.findcourses.showingCategoryId
                    ].categoryName;
                }


                _.each(categories, function(category) {
                    category.courseCount = category.courses.length +
                        MM.plugins.findcourses._countSubCatCourses(categories, category);
                });

                var values = {
                    'title': title,
                    'categories': categories,
                    'filter':MM.plugins.findcourses.showingCategoryId
                };

                var html = MM.tpl.render(
                    MM.plugins.findcourses.templates.results.html, values
                );

                MM.panels.show('center', html, {hideRight: false});
                MM.util.setupAccordion($("#panel-center"));
                MM.util.setupBackButton();
                $(document).find("a.unstarted").on(
                    MM.clickType, MM.plugins.findcourses._selfEnroll
                );
            }
        },

        lastEnrolledCourse:undefined,

        _selfEnroll: function(e) {
            var element = $(e.target);
            var courseId = element.data('courseid');
            MM.plugins.findcourses.lastEnrolledCourse = courseId;

            var course = MM.db.get('courses', courseId);

            // Render
            var enrolmentFormHTML = MM.tpl.render(
                MM.plugins.findcourses.templates.courseEnrolment.html, {
                    title: course.get('fullname'),
                    self_enrol_enabled: $(this).hasClass('self-enrol'),
                    key_required: $(this).hasClass('key-required')
                }
            );

            var options = {
                title: MM.lang.s("course-self-enrol-dialog"),
                buttons: {}
            };

            options.buttons[MM.lang.s('cancel')] = function() {
                MM.widgets.dialogClose();
            };

            MM.widgets.dialog(enrolmentFormHTML, options);

            $(document).find('.selfenrolmentform').removeClass('hidden');
            $(document).find('.selfenrolmentform input#enrol').on(MM.clickType, function() {
                var enrolmentKey = $(document).find(
                    '.selfenrolmentform input#enrolmentkey'
                ).val();
                var method = 'enrol_self_enrol';
                var data = {
                    courseid:MM.plugins.findcourses.lastEnrolledCourse,
                    enrolmentkey:enrolmentKey
                };
                var success = MM.plugins.findcourses._selfEnrollSuccess;
                var error = MM.plugins.findcourses._selfEnrollFailure;
                var preSets = {cache:false};
                MM.moodleWSCall(method, data, success, preSets, error);
            });
        },

        _selfEnrollSuccess: function(data) {
            // Clear the enrolment key.
            $(document).find('.selfenrolmentform input#enrolmentkey').val("");
            // Remove the event handler from the button
            $(document).find('.selfenrolmentform a#enrol').off(MM.clickType);
            // Hide the form
            $(document).find(".selfenrolmentform").addClass('hidden');

            // Remove the course id from memory.
            var courseId = MM.plugins.findcourses.lastEnrolledCourse;
            MM.plugins.findcourses.lastEnrolledCourse = undefined;

            if (data.enrolled) {
                // All working well, user has self enrolled, now go to the course page.
                MM.Router.navigate('#/courses/' + courseId, {trigger:true});
            } else {
                MM.popErrorMessage(MM.lang.s("self-enrol-error"));
            }
        },

        _selfEnrollFailure: function(data) {
        },

        _countSubCatCourses: function(cats, cat) {
            var i = 0;
            _.each(cats, function(cat2) {
                if (cat2.parent === cat.id) {
                    i += cat2.courses.length + MM.plugins.findcourses._countSubCatCourses(cats, cat2);
                }
            });
            return i;
        }
    };

    MM.registerPlugin(plugin);
});

