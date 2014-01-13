var requires = [
    "root/externallib/text!root/plugins/findcourses/courseEnrolment.html",
    "root/externallib/text!root/plugins/findcourses/findcourses.html"
];
define(requires, function(courseEnrolment, coursesTpl) {
    var plugin = {
        settings: {
            name: "findcourses",
            type: "general",
            title: "Find Courses",
            icon: "img/icon/find-courses.png",
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
                html: courseEnrolment
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
        },

        main: function(subCatId) {
            if (subCatId === undefined) {
                subCatId = 0;
            }
            MM.plugins.findcourses.showingCategoryId = subCatId;

            $(document).on(
                'categories_found', MM.plugins.findcourses._collateCategoriesAndCourses
            );
            $(document).on(
                'courses_found', MM.plugins.findcourses._collateCategoriesAndCourses
            );
            MM.plugins.findcourses._getCategories();
            MM.plugins.findcourses._getCourses();
        },

        _getCategories: function() {
            MM.panels.showLoading('center');
            MM.assignCurrentPlugin(MM.plugins.findcourses);
            MM.moodleWSCall(
                'core_course_get_categories',
                {},
                MM.plugins.findcourses._getCategoriesSuccessful,
                {},
                MM.plugins.findcourses._getCategoriesFailure
            );
        },

        _getCategoriesSuccessful: function(data) {
            MM.plugins.findcourses.categories = data;
            $(document).trigger('categories_found');
        },

        _getCategoriesFailure: function() {

        },

        _getCourses: function() {
            MM.moodleWSCall(
                'core_list_courses',
                {},
                MM.plugins.findcourses._getCoursesSuccessful,
                {},
                MM.plugins.findcourses._getCoursesFailure
            );
        },

        _getCoursesSuccessful: function(data) {
            MM.plugins.findcourses.courses = data;
            $(document).trigger('courses_found');
        },

        _getCoursesFailure: function() {

        },

        categories: undefined,
        courses: undefined,

        _collateCategoriesAndCourses: function() {
            if (MM.plugins.findcourses.categories !== undefined &&
                MM.plugins.findcourses.courses !== undefined
            ) {
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
                            // TODO: Query db to set whether the course is in
                            // progress or not.
                            course.started = 0;
                            course.completed = 0;
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
                var values = {
                    'title': title,
                    'categories': categories,
                    'filter':MM.plugins.findcourses.showingCategoryId
                };
                var html = MM.tpl.render(
                    MM.plugins.findcourses.templates.results.html, values, {}
                );
                MM.panels.show('center', html, {hideRight: false});
                MM.util.setupAccordion($("#panel-center"));
                MM.util.setupBackButton();
            }
        }
    };
    MM.registerPlugin(plugin);
});