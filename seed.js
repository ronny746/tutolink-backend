const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Category = require('./models/category');
const ClassOrCourse = require('./models/classCourse');
const Subject = require('./models/Subject');

mongoose.connect(process.env.MONGO_URL
    //  { useNewUrlParser: true, useUnifiedTopology: true }
)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

const seedData = async () => {
    try {
        // Clear existing data (optional)
        // await Subject.deleteMany({});
        // await ClassOrCourse.deleteMany({});
        // await Category.deleteMany({});

        // Step 1: Create Categories
        // const categories = await Category.insertMany([
        //     { name: "Academic" },
        //     { name: "College" },
        //     { name: "Preparation" }
        // ]);

        // const academic = categories.find(c => c.name === "Academic");
        // const college = categories.find(c => c.name === "College");
        // const preparation = categories.find(c => c.name === "Preparation");

        // // Step 2: Create Classes/Courses
        // const classOrCourses = await ClassOrCourse.insertMany([
        //     // Academic
        //     { name: "Class 6", categoryId: academic._id },
        //     { name: "Class 7", categoryId: academic._id },
        //     { name: "Class 8", categoryId: academic._id },
        //     { name: "Class 9", categoryId: academic._id },
        //     { name: "Class 10", categoryId: academic._id },
        //     { name: "Class 11", categoryId: academic._id },
        //     { name: "Class 12", categoryId: academic._id },

        //     // College
        //     { name: "B.Sc", categoryId: college._id },
        //     { name: "B.Com", categoryId: college._id },
        //     { name: "B.A", categoryId: college._id },
        //     { name: "B.Tech", categoryId: college._id },
        //     { name: "BBA", categoryId: college._id },
        //     { name: "BCA", categoryId: college._id },
        //     { name: "B.Pharma", categoryId: college._id },
        //     { name: "BFA", categoryId: college._id },
        //     { name: "LLB", categoryId: college._id },
        //     { name: "M.Sc", categoryId: college._id },
        //     { name: "M.Com", categoryId: college._id },
        //     { name: "M.A", categoryId: college._id },
        //     { name: "M.Tech", categoryId: college._id },
        //     { name: "MBA", categoryId: college._id },
        //     { name: "MCA", categoryId: college._id },
        //     { name: "M.Pharma", categoryId: college._id },
        //     { name: "MFA", categoryId: college._id },
        //     { name: "LLM", categoryId: college._id },

        //     // Preparation
        //     { name: "NEET", categoryId: preparation._id },
        //     { name: "JEE", categoryId: preparation._id },
        //     { name: "UPSC", categoryId: preparation._id },
        //     { name: "SSC", categoryId: preparation._id },
        //     { name: "Bank PO", categoryId: preparation._id },
        //     { name: "Railway", categoryId: preparation._id },
        //     { name: "CTET", categoryId: preparation._id },
        // ]);

        // const subjectsToInsert = [];

        // // Add subjects for Academic classes
        // const academicSubjectMap = {
        //     "Class 6": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science"],
        //     "Class 7": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science"],
        //     "Class 8": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science"],
        //     "Class 9": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science"],
        //     "Class 10": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Computer Science"],
        //     "Class 11": ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "Economics", "Accountancy", "Business Studies", "History", "Geography", "Political Science", "Sociology", "Psychology", "Physical Education"],
        //     "Class 12": ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "Economics", "Accountancy", "Business Studies", "History", "Geography", "Political Science", "Sociology", "Psychology", "Physical Education"]
        // };

        // classOrCourses
        //     .filter(c => c.categoryId.toString() === academic._id.toString())
        //     .forEach(c => {
        //         const subjects = academicSubjectMap[c.name];
        //         if (subjects) {
        //             subjects.forEach(sub => {
        //                 subjectsToInsert.push({ name: sub, classOrCourseId: c._id });
        //             });
        //         }
        //     });

        // // Add subjects for College
        // const collegeSubjectMap = {
        //     "B.Sc": ["Physics", "Chemistry", "Biology", "Mathematics"],
        //     "B.Com": ["Accountancy", "Economics", "Business Studies"],
        //     "B.A": ["History", "Political Science", "Geography", "English"],
        //     "B.Tech": ["Computer Science", "Electronics", "Mechanical", "Mathematics"],
        //     "BBA": ["Marketing", "Finance", "HR", "Business Law"],
        //     "BCA": ["Programming", "Data Structures", "Computer Networks"],
        //     "B.Pharma": ["Pharmacology", "Medicinal Chemistry", "Pharmaceutics"],
        //     "BFA": ["Drawing", "Art History", "Sculpture"],
        //     "LLB": ["Constitutional Law", "Criminal Law", "Civil Law"],
        //     "M.Sc": ["Advanced Physics", "Advanced Chemistry", "Research Methods"],
        //     "M.Com": ["Taxation", "Auditing", "Financial Management"],
        //     "M.A": ["Sociology", "Philosophy", "English Literature"],
        //     "M.Tech": ["Machine Learning", "Embedded Systems", "Robotics"],
        //     "MBA": ["Strategic Management", "Finance", "Operations"],
        //     "MCA": ["Advanced Programming", "Software Engineering", "AI"],
        //     "M.Pharma": ["Clinical Pharmacy", "Pharmacokinetics", "Drug Development"],
        //     "MFA": ["Art Criticism", "Digital Art", "Modern Art"],
        //     "LLM": ["International Law", "Corporate Law", "Cyber Law"]
        // };

        // classOrCourses
        //     .filter(c => c.categoryId.toString() === college._id.toString())
        //     .forEach(c => {
        //         const subjects = collegeSubjectMap[c.name];
        //         if (subjects) {
        //             subjects.forEach(sub => {
        //                 subjectsToInsert.push({ name: sub, classOrCourseId: c._id });
        //             });
        //         }
        //     });

        // // Add subjects for Preparation
        // const preparationMap = {
        //     NEET: ["Physics", "Chemistry", "Biology"],
        //     JEE: ["Physics", "Chemistry", "Mathematics"],
        //     UPSC: ["History", "Geography", "Polity", "Economics"],
        //     SSC: ["Reasoning", "English", "Maths", "GK"],
        //     "Bank PO": ["Reasoning", "Quantitative Aptitude", "English", "Computer"],
        //     Railway: ["Maths", "Reasoning", "General Awareness"],
        //     CTET: ["Child Development", "Pedagogy", "Maths", "EVS"]
        // };

        // classOrCourses
        //     .filter(c => c.categoryId.toString() === preparation._id.toString())
        //     .forEach(c => {
        //         const prepSubjects = preparationMap[c.name];
        //         if (prepSubjects) {
        //             prepSubjects.forEach(sub => {
        //                 subjectsToInsert.push({ name: sub, classOrCourseId: c._id });
        //             });
        //         }
        //     });

        // await Subject.insertMany(subjectsToInsert);

        const subjectUpdates = {
        //    "Mathematics": {
        //         description: "The study of numbers, shapes, and patterns.",
        //     iconUrl:"https://storage.googleapis.com/news-admin-997b0.appspot.com/sliders/70092440-637d-4971-aa32-e60d2fd57b87-aaaaa.png?GoogleAccessId=firebase-adminsdk-3ubmp%40news-admin-997b0.iam.gserviceaccount.com&Expires=1893436200&Signature=dXyCX8xjm%2F3w%2F7GdltJk6gDvwU%2B%2BE3%2BLXMofUGoH9JGEwP9Xft5qoqfaFW87dUHXGGEmfjN1fXxOOln3QC%2F7YNvwBRtEpp3uivLLiRW1SvEk1UW1uDKqq77JCnquZ5C1jsLIdgRHNzrGqtnihpPrH2eBmYcTtkhaDZfiJECj0XgjSLSOMgJsV0%2BiD0kjI%2BmWtcMtvi%2BJc1dvguguwqPozww%2BEHwfupnPCum7EM6OugAnrPp1Mlu853Y0l%2BvtqrC%2Bcqh4Wmg5MqKiLGbrHgxmibWDD8nz1UpL0nygdCd0EnpMNwrt3Wx7fiUNP%2FVOacE6Gr0lsiwTiGo3u7szDqA%2B6Q%3D%3D"},
        //     "Science": {
        //         description: "Exploration of the natural and physical world.",
        //         iconUrl: "https://storage.googleapis.com/news-admin-997b0.appspot.com/images/a409a569-25fd-4045-89c8-ede310f764e5-Science.png?GoogleAccessId=firebase-adminsdk-3ubmp%40news-admin-997b0.iam.gserviceaccount.com&Expires=1893436200&Signature=RwxLi6KbL0rrtU5IfRp0cAHRjWhVsyFFJFQhuwW4d%2BZLTmn1wkgmOd2k%2BqVxqQKZmzrZES%2FFX8yPu6Drpz57PKxpsLilROfyRmQ08UUPbF2yABv9naaKC0Oawh913VJAiAMaMgmU%2Fh64j09G2iugd4XSdjEu0AAz42aQMtTHxq5%2BNA%2BoZCuYiU%2Fmaq6jVu%2FYD5ail3T5MpJ8%2F6ifcyGmsEnYHClGH3jMrGnEUYqN9QgBvNpIkdeW0yYtqzS0cbQ7DkQzDL2ZhoV9MfY95PLYgvPK30GuEJc%2FccVTb0oqpMWhh6rtw9x4rP9z4Mmi4eHbCnOzxeIYWZ13xjddcXxl9Q%3D%3D"
        //     },
        //     "English": {
        //         description: "Study of literature, grammar, and communication.",
        //     iconUrl:"https://storage.googleapis.com/news-admin-997b0.appspot.com/images/6baa343a-0b73-47b8-b407-4cb429bb5bd3-English.png?GoogleAccessId=firebase-adminsdk-3ubmp%40news-admin-997b0.iam.gserviceaccount.com&Expires=1893436200&Signature=WLE%2Bc3H6VfYtt%2Br2OcDYQ8fhFD0FiOSFSLyUJ793IZ6yfqhyx2Fxmwl2d6v0q%2FcsDKkXY5GnGnvqDhTJwoTWnJZ%2Bvq%2FWZ%2FZXtTxjBbSpqNcQJsvFFlvpkn%2FSSLREQaNiDQkXkwkRuzYfBjzSWFQeZW7Wp0MsYGISxM%2BNqASlO94yAqBE%2FQPXKoJKC37kVRanLTYncGpq6rLv0BQA%2B3a1EbU4T8W%2BkCp6qoHXCUWjN2a2x80nB5CeUZenn%2F%2BLBXivgFSSVLU164cbsnj9WT5M0kmRZfdwgFYEUpEAnccOpeRiVxsyM7%2BKJMebqedoiNcE4HVpCzwrYPpcbKZJA9a8WA%3D%3D"},
        //     "Social Science": {
        //         description: "Covers History, Geography, Civics, and Economics.",
        //         iconUrl: "https://storage.googleapis.com/news-admin-997b0.appspot.com/images/970c0cda-37a7-4cf4-ae4f-8dc3bdd80da4-History.png?GoogleAccessId=firebase-adminsdk-3ubmp%40news-admin-997b0.iam.gserviceaccount.com&Expires=1893436200&Signature=omISfDlRfRqtI3vi53%2FwLR0KPnz43YfXF6ylWu8M%2FdnNRgiLgH92yHdfbpyBKG%2BHSMayzhpOs5iyTHAwjJYwRLbt4BcPnHF6sTXBcB3AjckGWv%2FwEneg2rLCuh2EutBgfkWjMOt%2BaOvSIioZKQzI%2FvK0UhnqW%2B%2FTCIceDYE2FQa2Hwe6u7KcY92%2FMW79nx8dNyJmbrLVvjBLDijG70Hv0cNQi7jb37ecbKwVIOeEBKlBJz9FV3hqAuw7OXSQK%2BD9Cz0mfqlKMC4FPv113godqyeB2srmloClQmrlI4cAB8cdsLOqpsWTj6mGQ7Mdxg7Cj6Pu5T9GjmLxQxIUQnf1Wg%3D%3D"
        //     },
        //     "Computer Science": {
        //         description: "Study of computers, programming, and IT.",
        //         iconUrl: "https://storage.googleapis.com/news-admin-997b0.appspot.com/subjects/e1b59667-7ce9-43ba-a874-0deb5b8a36a3-Coding%2C%20programming%20languages.png?GoogleAccessId=firebase-adminsdk-3ubmp%40news-admin-997b0.iam.gserviceaccount.com&Expires=1893436200&Signature=VGFGd9nQ2b6FhUxwKScVVPCqiB%2FmNt7DmALDyv2%2FPtK08UDZA6qJBdsTw6edN%2BtUhNTz90Rj7l1gXzO%2F6DRW%2Ff6HmhTK1gB%2FJBtPYra9T7GJIP7XJ3OzS5r0d1jSG16x0zOe0viFgwOnLqWDMuoF6jK0wvkvsMKuRgGf7d859lhn1N0bKsqmlmWTkyWaDe0Tclfr3FHczKd2JBeSAZUN5qgt4a7Zxs4PeUjhsIJRTt4rUI7BVL4sQyoCi%2FF3Jit4pk66rHBpRNhYB4gkgA%2B6MPY5AlT5ZzgyRflBPr%2FBYRa%2FK%2F1g8mGprgH7heFJjstp4rs5XIJZGHESTerBSknysw%3D%3D"
        //     },
        };

        for (const [subjectName, updates] of Object.entries(subjectUpdates)) {
            await Subject.updateMany(
                { name: subjectName },
                {
                    $set: {
                        description: updates.description,
                        iconUrl: updates.iconUrl
                    }
                }
            );
        }

        console.log("✅ Subjects updated successfully.");

        // console.log("✅ Data seeded successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding error:", err);
        process.exit(1);
    }
};

seedData();
