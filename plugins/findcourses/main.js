var requires = [
    "root/externallib/text!root/plugins/findcourses/findcourses.html"
];

define(requires, function(coursesTpl) {

    var callbacks = {
        collate_categories_and_courses: function(data) {
            var missing_categories = false;
            // Get all the categories with all their correct courses below
            // them.
            var categories = _.reduceRight(data, function(memo, course) {
                if (course.categoryid === 0) return memo;

                var category = MM.db.get(
                    'categories', course.categoryid
                );
                if (category !== undefined) {
                    var categoryName = category.get('name');

                    if (memo[category.get('id')] === undefined){
                        memo[category.get('id')] = {
                            'courses':[],
                            'subcategories':[]
                        };
                    }

                    // Has the user already started this course?
                    // Course id is mildly contrived, but stops collisions between
                    // sites.
                    var courseId = MM.config.current_site.id + '-' + course.id;
                    if (MM.db.exists("mylearning")) {
                        course.started = MM.db.get('mylearning', courseId) !== undefined;
                    } else {
                        course.started = false;
                    }
                    course.started = false;

                    memo[category.get('id')].categoryName = categoryName;
                    memo[category.get('id')].courses.push(course);
                } else {
                    missing_categories = true;
                }

                return memo;
            }, {});

            // If we're missing categories then we'll be returning false.
            // Otherwise, go through all the categories, and move them under
            // the appropriate parent if applicable.
            if (missing_categories === true) {
                categories = false;
            } else {
                // Do moving.
                var moved = true;
                while (moved == true) {
                    moved = false;
                    var keys = _.keys(categories);
                    for (var i = keys.length; i >= 0; i--) {
                        // Undefined categories have already been sorted.
                        if (categories[keys[i]] == undefined) {
                            continue;
                        }
                        var category = MM.db.get('categories', keys[i]);
                        if (category !== undefined) {
                            if (category.get('parent') != 0) {
                                categories[category.get('parent')].subcategories.push(
                                    category
                                );
                                moved = true;
                                categories[category.get('id')] = undefined;
                            }
                        }
                    }
                }
            }

            return categories;
        },

        find_courses_successful:function(data) {
            var categories = callbacks.collate_categories_and_courses(data);

            if (categories !== false) {
                var values = {
                    'categories' : categories
                    , title: MM.plugins.findcourses.settings.title
                };
                var html = MM.tpl.render(
                    MM.plugins.findcourses.templates.results.html, values, {}
                );
                MM.panels.show('center', html, {hideRight: false});
                MM.util.setupAccordion();
            } else {
                // Record these results - they're still valid.
                MM.plugins.findcourses.last_found_courses = data;

                // Go and get the refreshed list of categories.
                // This goes back to find_categories_successful.
                MM.plugins.findcourses.list_categories();
            }
        },

        find_categories_successful: function(data) {
            // Store the categories in the app.
            // Categories are stored against the site id.
            _.each(data, function(category) {
                MM.db.insert('categories', category)
            });

            plugin.find_courses();
        },

        manual_enrolment_successful: function() {
            // Change the url, don't actually navigate to it though.
            MM.Router.navigate("#find_courses", {'trigger':false});

            var courseId = MM.plugins.findcourses.plugin.last_enrolled_course;

            // Take the last enrolled course and set it as 'started'
            MM.db.update(
                "courses",
                courseId,
                {'started':true}
            );

            // Take the details of the course
            var course = MM.db.get("courses", courseId);

            // and add them to the my_learning section.
            MM.db.insert("my_learning", course);

            MM.plugins.findcourses.list_categories();
        },

        error: function(data) {
            console.log("Error");
            console.log(data);
        }

    }

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
            ["find_courses", "find_courses", "list_categories"],
            ["enrol_user/:courseId", "enrol_user", "enrol_user"]
        ],

        templates: {
            "results": {
                html: coursesTpl
            }
        },

        last_enrolled_course: null,
        last_found_courses:undefined,

        sizes: undefined,

        _getSizes: function() {
            MM.plugins.findcourses.sizes = {
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
            if (MM.plugins.findcourses.sizes == undefined) {
                MM.plugins.findcourses._getSizes();
            }

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
            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        enrol_user: function(courseId) {
            MM.assignCurrentPlugin(MM.plugins.findcourses);

            // RoleId 5 = Student
            // This format isn't a mistake, the call requires an array
            // of arrays.
            var data = {
                'enrolments':[{
                    roleid: 5,
                    userid: MM.site.get('userid'),
                    courseid: courseId
                }]
            };

            MM.plugins.findcourses.last_enrolled_course = courseId;

            MM.moodleWSCall(
                'enrol_manual_enrol_users',
                data,
                callbacks.manual_enrolment_successful,
                {responseExpected:false},
                callbacks.error
            );
        },

        list_categories: function() {
            MM.panels.showLoading('center');
            MM.assignCurrentPlugin(MM.plugins.findcourses);
            MM.moodleWSCall(
                'core_course_get_categories',
                {},
                callbacks.find_categories_successful,
                {},
                callbacks.error
            );
        },

        find_courses: function() {
            if (MM.plugins.findcourses.last_found_courses !== undefined) {
                callbacks.find_courses_successful(
                    MM.plugins.findcourses.last_found_courses
                );
                MM.plugins.findcourses.last_found_courses = undefined;
            } else {
                MM.moodleWSCall(
                    'core_course_get_courses',
                    {},
                    callbacks.find_courses_successful,
                    {},
                    callbacks.error
                );
            }
        }
    };

    MM.registerPlugin(plugin);
});
