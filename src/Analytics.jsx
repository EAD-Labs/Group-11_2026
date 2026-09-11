import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  School, Users, Target, TrendingUp, BarChart3, Compass, Layers,
  GraduationCap, Smartphone, Search, Download, ChevronRight, Info,
  ArrowUpRight, ArrowDownRight, Minus, Table2, LineChart as LineChartIcon,
} from "lucide-react";

const DATA = {"kpis": {"totalSchools": 278, "totalStudentsAssessed": 7334, "totalAssessmentsConducted": 20000, "participationRate": 50.7, "avgScorePct": 41.9, "yearRange": [2016, 2026], "usageSchools": 129, "usageEvents": 20000, "usageDateRange": ["2021-12-24 16:07:25", "2022-01-20 17:00:59"]}, "performanceBySubjectClass": [{"subject": "English", "class": 2, "avgPct": 60.1, "n": 806}, {"subject": "English", "class": 3, "avgPct": 48.3, "n": 1274}, {"subject": "English", "class": 4, "avgPct": 37.4, "n": 1328}, {"subject": "English", "class": 5, "avgPct": 28.8, "n": 1405}, {"subject": "Maths", "class": 2, "avgPct": 44.3, "n": 1330}, {"subject": "Maths", "class": 3, "avgPct": 43.2, "n": 1271}, {"subject": "Maths", "class": 4, "avgPct": 37.9, "n": 1321}, {"subject": "Maths", "class": 5, "avgPct": 43.6, "n": 1409}], "trendsBySubjectYear": [{"subject": "English", "year": 2016, "avgPct": 33.2, "n": 514}, {"subject": "Maths", "year": 2016, "avgPct": 47.8, "n": 710}, {"subject": "English", "year": 2017, "avgPct": 42.8, "n": 1131}, {"subject": "Maths", "year": 2017, "avgPct": 42.4, "n": 1462}, {"subject": "English", "year": 2018, "avgPct": 44.0, "n": 1168}, {"subject": "Maths", "year": 2018, "avgPct": 41.5, "n": 1166}, {"subject": "English", "year": 2019, "avgPct": 44.4, "n": 1076}, {"subject": "Maths", "year": 2019, "avgPct": 43.2, "n": 1071}, {"subject": "English", "year": 2020, "avgPct": 39.6, "n": 860}, {"subject": "Maths", "year": 2020, "avgPct": 38.9, "n": 858}, {"subject": "English", "year": 2022, "avgPct": 20.3, "n": 64}, {"subject": "Maths", "year": 2022, "avgPct": 21.8, "n": 64}], "topicAccuracy": [{"topic": "Odd and Even number", "subject": "Maths", "attempts": 36, "accuracyPct": 16.7}, {"topic": "Rhyming words", "subject": "English", "attempts": 243, "accuracyPct": 24.0}, {"topic": "Picture comprehension", "subject": "English", "attempts": 63, "accuracyPct": 29.3}, {"topic": "Measurement", "subject": "Maths", "attempts": 475, "accuracyPct": 29.8}, {"topic": "Reading Comprehension", "subject": "English", "attempts": 1106, "accuracyPct": 30.8}, {"topic": "Addition-Subtraction Property", "subject": "Maths", "attempts": 641, "accuracyPct": 33.9}, {"topic": "Multiplication-Division Property", "subject": "Maths", "attempts": 392, "accuracyPct": 39.2}, {"topic": "Division", "subject": "Maths", "attempts": 850, "accuracyPct": 40.0}, {"topic": "Addition with fill in the blanks", "subject": "Maths", "attempts": 50, "accuracyPct": 41.7}, {"topic": "Punctuation", "subject": "English", "attempts": 993, "accuracyPct": 42.3}, {"topic": "Sentence", "subject": "English", "attempts": 3554, "accuracyPct": 42.8}, {"topic": "Short form", "subject": "Maths", "attempts": 88, "accuracyPct": 43.2}, {"topic": "Subtraction with change", "subject": "Maths", "attempts": 1301, "accuracyPct": 46.4}, {"topic": "Grammar", "subject": "English", "attempts": 279, "accuracyPct": 46.7}, {"topic": "Translate from Tamil to English", "subject": "English", "attempts": 284, "accuracyPct": 47.0}, {"topic": "Time", "subject": "Maths", "attempts": 145, "accuracyPct": 47.5}, {"topic": "Addition", "subject": "Maths", "attempts": 102, "accuracyPct": 48.3}, {"topic": "Multiplication", "subject": "Maths", "attempts": 1662, "accuracyPct": 50.3}, {"topic": "Translate from English to Tamil", "subject": "English", "attempts": 231, "accuracyPct": 51.0}, {"topic": "Word problem", "subject": "Maths", "attempts": 210, "accuracyPct": 52.1}, {"topic": "Spelling", "subject": "English", "attempts": 324, "accuracyPct": 52.2}, {"topic": "Number Concept", "subject": "Maths", "attempts": 2873, "accuracyPct": 52.2}, {"topic": "Money", "subject": "Maths", "attempts": 32, "accuracyPct": 53.6}, {"topic": "Vocabulary", "subject": "English", "attempts": 4358, "accuracyPct": 55.5}, {"topic": "Zero property", "subject": "Maths", "attempts": 128, "accuracyPct": 57.4}, {"topic": "Expanded form", "subject": "Maths", "attempts": 95, "accuracyPct": 58.2}, {"topic": "Factor", "subject": "Maths", "attempts": 40, "accuracyPct": 59.0}, {"topic": "Estimation", "subject": "Maths", "attempts": 42, "accuracyPct": 60.0}, {"topic": "Subtraction with fill in the blanks", "subject": "Maths", "attempts": 40, "accuracyPct": 60.0}, {"topic": "Addition without change", "subject": "Maths", "attempts": 1268, "accuracyPct": 61.0}, {"topic": "Fraction", "subject": "Maths", "attempts": 368, "accuracyPct": 63.4}, {"topic": "Comparison", "subject": "Maths", "attempts": 180, "accuracyPct": 64.9}, {"topic": "Numerals", "subject": "Maths", "attempts": 726, "accuracyPct": 65.7}, {"topic": "Shapes", "subject": "Maths", "attempts": 266, "accuracyPct": 66.3}, {"topic": "Addition Word Problem", "subject": "Maths", "attempts": 427, "accuracyPct": 68.5}, {"topic": "Subtraction", "subject": "Maths", "attempts": 84, "accuracyPct": 70.9}, {"topic": "Geometry", "subject": "Maths", "attempts": 168, "accuracyPct": 77.1}, {"topic": "Skip counting", "subject": "Maths", "attempts": 32, "accuracyPct": 78.6}, {"topic": "picture identification", "subject": "English", "attempts": 180, "accuracyPct": 80.0}], "correlationMotherEd": [{"level": "NA", "avgPct": 42.6, "n": 14}, {"level": "NONE", "avgPct": 32.2, "n": 757}, {"level": "PRIMARY", "avgPct": 37.7, "n": 855}, {"level": "MIDDLE", "avgPct": 42.8, "n": 893}, {"level": "HIGH", "avgPct": 47.7, "n": 986}, {"level": "HIGHER SECONDARY", "avgPct": 42.9, "n": 346}, {"level": "DIPLOMA", "avgPct": 41.6, "n": 14}, {"level": "BACHELORS", "avgPct": 58.8, "n": 60}], "correlationFatherEd": [{"level": "NA", "avgPct": 51.3, "n": 32}, {"level": "NONE", "avgPct": 29.2, "n": 724}, {"level": "PRIMARY", "avgPct": 37.2, "n": 735}, {"level": "MIDDLE", "avgPct": 42.6, "n": 719}, {"level": "HIGH", "avgPct": 48.1, "n": 1143}, {"level": "HIGHER SECONDARY", "avgPct": 43.7, "n": 444}, {"level": "DIPLOMA", "avgPct": 47.6, "n": 32}, {"level": "BACHELORS", "avgPct": 50.8, "n": 82}, {"level": "MASTERS", "avgPct": 48.2, "n": 12}], "correlationTuition": [{"label": "No", "avgPct": 40.8, "n": 1156}, {"label": "Yes", "avgPct": 36.1, "n": 550}], "correlationBreakfast": [{"label": "No", "avgPct": 31.1, "n": 32}, {"label": "Yes", "avgPct": 39.5, "n": 1674}], "correlationHomework": [{"label": "No", "avgPct": 27.1, "n": 286}, {"label": "N/A", "avgPct": 55.8, "n": 30}, {"label": "Yes", "avgPct": 39.8, "n": 1518}], "genderGap": [{"label": "Boys", "avgPct": 40.0, "n": 4592}, {"label": "Girls", "avgPct": 43.5, "n": 5552}], "byLocationType": [{"label": "Rural", "avgPct": 42.0, "n": 8648}, {"label": "Urban", "avgPct": 44.5, "n": 238}], "oralVsFull": [{"label": "Written/Mixed", "avgPct": 42.8, "n": 2431}, {"label": "Full Oral", "avgPct": 41.6, "n": 7713}], "topActions": [{"action": "Content Opened", "count": 6465}, {"action": "Content Closed", "count": 3696}, {"action": "Search For", "count": 3457}, {"action": "Content Launched", "count": 1203}, {"action": "Applaunch", "count": 982}, {"action": "Content Download", "count": 935}, {"action": "Search Content", "count": 757}, {"action": "Liked", "count": 584}, {"action": "Opened Registration", "count": 503}, {"action": "Registration", "count": 371}, {"action": "Settings", "count": 326}, {"action": "Package Download", "count": 131}], "topSubjectsOpened": [{"subject": "Maths", "count": 641}, {"subject": "English", "count": 489}, {"subject": "Social Science", "count": 214}, {"subject": "Science", "count": 161}, {"subject": "Tamil", "count": 101}, {"subject": "Computer Science", "count": 84}, {"subject": "EVS", "count": 24}, {"subject": "Computer science", "count": 3}], "topContentOpened": [{"title": "The Universe and Solar System", "count": 204}, {"title": "Trip to the store \u2013 Lesson plan", "count": 94}, {"title": "Base Blocks", "count": 60}, {"title": "Solar system", "count": 53}, {"title": "Solar System for Kids", "count": 42}, {"title": "King of math(Addition and Subtraction)", "count": 18}, {"title": "Diffy", "count": 17}, {"title": "Numbers \u2013 Lesson plan", "count": 15}, {"title": "Geometry \u2013 Lesson plan", "count": 14}, {"title": "Action & nouns", "count": 14}, {"title": "Numbers", "count": 13}, {"title": "My pet \u2013 Lesson plan", "count": 13}], "schoolsPerYear": [{"year": 2023, "n": 128}, {"year": 2024, "n": 134}, {"year": 2025, "n": 131}, {"year": 2026, "n": 135}]};

const REAL_DATA = {"years":[2016,2017,2018,2019,2020,2022],"byYear":{"2016":{"schoolAverages":{"classSubjectCols":["1-E","1-M","2-E","2-M","3-E","3-M","4-E","4-M","5-E","5-M","6-E","6-M"],"schools":[{"schoolId":1,"cells":{"2-M":{"avg":13.0,"max":25,"attempted":14,"total":14},"3-M":{"avg":9.78,"max":25,"attempted":9,"total":9},"4-M":{"avg":13.22,"max":30,"attempted":18,"total":18},"5-M":{"avg":12.07,"max":33,"attempted":14,"total":14},"3-E":{"avg":10.33,"max":15,"attempted":9,"total":9},"4-E":{"avg":3.33,"max":19,"attempted":18,"total":18},"5-E":{"avg":2.71,"max":20,"attempted":14,"total":14}}},{"schoolId":2,"cells":{"2-M":{"avg":8.82,"max":25,"attempted":22,"total":22},"3-M":{"avg":0.0,"max":25,"attempted":15,"total":15},"4-M":{"avg":0.0,"max":30,"attempted":23,"total":23},"5-M":{"avg":16.32,"max":33,"attempted":22,"total":22},"3-E":{"avg":0.0,"max":15,"attempted":15,"total":15},"4-E":{"avg":0.0,"max":19,"attempted":23,"total":23},"5-E":{"avg":7.45,"max":20,"attempted":22,"total":22}}},{"schoolId":3,"cells":{"2-M":{"avg":9.91,"max":25,"attempted":11,"total":11},"3-M":{"avg":11.27,"max":25,"attempted":15,"total":15},"4-M":{"avg":9.75,"max":30,"attempted":8,"total":8},"5-M":{"avg":10.71,"max":33,"attempted":7,"total":7},"3-E":{"avg":8.93,"max":15,"attempted":15,"total":15},"4-E":{"avg":2.25,"max":19,"attempted":8,"total":8},"5-E":{"avg":2.71,"max":20,"attempted":7,"total":7}}},{"schoolId":4,"cells":{"2-M":{"avg":12.0,"max":25,"attempted":5,"total":5},"3-M":{"avg":12.33,"max":25,"attempted":3,"total":3},"4-M":{"avg":14.0,"max":30,"attempted":6,"total":6},"5-M":{"avg":14.17,"max":33,"attempted":6,"total":6},"3-E":{"avg":7.33,"max":15,"attempted":3,"total":3},"4-E":{"avg":3.17,"max":19,"attempted":6,"total":6},"5-E":{"avg":2.17,"max":20,"attempted":6,"total":6}}},{"schoolId":5,"cells":{"2-M":{"avg":11.15,"max":25,"attempted":20,"total":20},"3-M":{"avg":8.67,"max":25,"attempted":12,"total":12},"4-M":{"avg":7.53,"max":30,"attempted":17,"total":17},"5-M":{"avg":8.92,"max":33,"attempted":12,"total":12},"3-E":{"avg":8.58,"max":15,"attempted":12,"total":12},"4-E":{"avg":3.88,"max":19,"attempted":17,"total":17},"5-E":{"avg":3.58,"max":20,"attempted":12,"total":12}}},{"schoolId":6,"cells":{"2-M":{"avg":13.33,"max":25,"attempted":3,"total":3},"3-M":{"avg":17.44,"max":25,"attempted":9,"total":9},"4-M":{"avg":11.85,"max":30,"attempted":13,"total":13},"5-M":{"avg":20.71,"max":33,"attempted":7,"total":7},"3-E":{"avg":10.67,"max":15,"attempted":9,"total":9},"4-E":{"avg":2.69,"max":19,"attempted":13,"total":13},"5-E":{"avg":6.57,"max":20,"attempted":7,"total":7}}},{"schoolId":7,"cells":{"2-M":{"avg":16.4,"max":25,"attempted":5,"total":5},"3-M":{"avg":8.82,"max":25,"attempted":11,"total":11},"4-M":{"avg":5.54,"max":30,"attempted":13,"total":13},"5-M":{"avg":4.5,"max":33,"attempted":14,"total":14},"3-E":{"avg":6.36,"max":15,"attempted":11,"total":11},"4-E":{"avg":1.38,"max":19,"attempted":13,"total":13},"5-E":{"avg":0.93,"max":20,"attempted":14,"total":14}}},{"schoolId":8,"cells":{"2-M":{"avg":15.8,"max":25,"attempted":5,"total":5},"3-M":{"avg":13.5,"max":25,"attempted":12,"total":12},"4-M":{"avg":12.22,"max":30,"attempted":9,"total":9},"5-M":{"avg":17.88,"max":33,"attempted":8,"total":8},"3-E":{"avg":8.92,"max":15,"attempted":12,"total":12},"4-E":{"avg":3.44,"max":19,"attempted":9,"total":9},"5-E":{"avg":3.25,"max":20,"attempted":8,"total":8}}},{"schoolId":9,"cells":{"2-M":{"avg":11.47,"max":25,"attempted":15,"total":15},"3-M":{"avg":7.5,"max":25,"attempted":10,"total":10},"4-M":{"avg":11.71,"max":30,"attempted":17,"total":17},"5-M":{"avg":10.86,"max":33,"attempted":7,"total":7},"3-E":{"avg":8.8,"max":15,"attempted":10,"total":10},"4-E":{"avg":3.06,"max":19,"attempted":17,"total":17},"5-E":{"avg":3.29,"max":20,"attempted":7,"total":7}}},{"schoolId":10,"cells":{"2-M":{"avg":10.17,"max":25,"attempted":12,"total":12},"3-M":{"avg":8.0,"max":25,"attempted":4,"total":4},"4-M":{"avg":8.33,"max":30,"attempted":15,"total":15},"5-M":{"avg":6.0,"max":33,"attempted":11,"total":11},"3-E":{"avg":5.5,"max":15,"attempted":4,"total":4},"4-E":{"avg":2.6,"max":19,"attempted":15,"total":15},"5-E":{"avg":2.18,"max":20,"attempted":11,"total":11}}},{"schoolId":11,"cells":{"2-M":{"avg":5.21,"max":25,"attempted":14,"total":14},"3-M":{"avg":9.56,"max":25,"attempted":16,"total":16},"4-M":{"avg":11.73,"max":30,"attempted":11,"total":11},"5-M":{"avg":6.0,"max":33,"attempted":16,"total":16},"3-E":{"avg":8.25,"max":15,"attempted":16,"total":16},"4-E":{"avg":3.0,"max":19,"attempted":11,"total":11},"5-E":{"avg":1.81,"max":20,"attempted":16,"total":16}}},{"schoolId":12,"cells":{"2-M":{"avg":20.12,"max":25,"attempted":41,"total":41},"3-M":{"avg":5.54,"max":25,"attempted":57,"total":57},"4-M":{"avg":20.16,"max":30,"attempted":45,"total":45},"5-M":{"avg":16.24,"max":33,"attempted":25,"total":25},"3-E":{"avg":4.18,"max":15,"attempted":57,"total":57},"4-E":{"avg":8.49,"max":19,"attempted":45,"total":45},"5-E":{"avg":4.68,"max":20,"attempted":25,"total":25}}},{"schoolId":13,"cells":{"2-M":{"avg":22.08,"max":25,"attempted":13,"total":13},"3-M":{"avg":16.94,"max":25,"attempted":18,"total":18},"4-M":{"avg":21.53,"max":30,"attempted":15,"total":15},"5-M":{"avg":23.68,"max":33,"attempted":19,"total":19},"3-E":{"avg":10.17,"max":15,"attempted":18,"total":18},"4-E":{"avg":7.8,"max":19,"attempted":15,"total":15},"5-E":{"avg":4.53,"max":20,"attempted":19,"total":19}}},{"schoolId":14,"cells":{"2-M":{"avg":10.64,"max":25,"attempted":14,"total":14},"4-M":{"avg":10.88,"max":30,"attempted":8,"total":8},"5-M":{"avg":14.6,"max":33,"attempted":10,"total":10},"4-E":{"avg":3.12,"max":19,"attempted":8,"total":8},"5-E":{"avg":4.2,"max":20,"attempted":10,"total":10}}},{"schoolId":18,"cells":{"2-M":{"avg":5.86,"max":25,"attempted":7,"total":7},"3-M":{"avg":5.5,"max":25,"attempted":8,"total":8},"4-M":{"avg":9.25,"max":30,"attempted":8,"total":8},"5-M":{"avg":6.57,"max":33,"attempted":7,"total":7},"3-E":{"avg":3.88,"max":15,"attempted":8,"total":8},"4-E":{"avg":2.62,"max":19,"attempted":8,"total":8},"5-E":{"avg":1.71,"max":20,"attempted":7,"total":7}}}]},"oralStatus":{"English":[],"Maths":[],"Tamil":[]},"overallScores":{"English":[{"class":3,"writtenScorePct":62.4,"oralProgressPct":null},{"class":4,"writtenScorePct":24.2,"oralProgressPct":null},{"class":5,"writtenScorePct":20.0,"oralProgressPct":null}],"Maths":[{"class":2,"writtenScorePct":55.0,"oralProgressPct":null},{"class":3,"writtenScorePct":49.7,"oralProgressPct":null},{"class":4,"writtenScorePct":45.4,"oralProgressPct":null},{"class":5,"writtenScorePct":41.2,"oralProgressPct":null}],"Tamil":[]},"oralProgression":{"English":[],"Maths":[],"Tamil":[]},"writtenQuestionwise":{"2":{"Maths":[{"q":"1","avgPct":56.8},{"q":"2","avgPct":70.5},{"q":"3","avgPct":31.8},{"q":"4","avgPct":31.8},{"q":"5","avgPct":81.8},{"q":"6","avgPct":61.4},{"q":"7","avgPct":43.2},{"q":"8","avgPct":65.9},{"q":"9","avgPct":31.8},{"q":"10","avgPct":22.7},{"q":"11","avgPct":43.2},{"q":"12","avgPct":25.0},{"q":"13","avgPct":18.2},{"q":"14","avgPct":65.9},{"q":"15","avgPct":40.9},{"q":"16","avgPct":36.4},{"q":"17","avgPct":18.2},{"q":"18","avgPct":22.7},{"q":"19","avgPct":29.5},{"q":"20","avgPct":29.5},{"q":"21","avgPct":13.6},{"q":"22","avgPct":34.1},{"q":"23","avgPct":13.6},{"q":"24","avgPct":13.6}]},"3":{"Maths":[{"q":"1","avgPct":26.5},{"q":"2","avgPct":55.9},{"q":"3","avgPct":61.8},{"q":"4","avgPct":73.5},{"q":"5","avgPct":76.5},{"q":"6","avgPct":79.4},{"q":"7","avgPct":79.4},{"q":"8","avgPct":61.8},{"q":"9","avgPct":58.8},{"q":"10","avgPct":58.8},{"q":"11","avgPct":11.8},{"q":"12","avgPct":52.9},{"q":"13","avgPct":38.2},{"q":"14","avgPct":32.4},{"q":"15","avgPct":23.5},{"q":"16","avgPct":52.9},{"q":"17","avgPct":52.9},{"q":"18","avgPct":2.9},{"q":"19","avgPct":17.6},{"q":"20","avgPct":42.6},{"q":"21","avgPct":38.2},{"q":"22","avgPct":41.2}],"English":[{"q":"I.a","avgPct":50.0},{"q":"I.b","avgPct":55.9},{"q":"I.c","avgPct":35.3},{"q":"II.a","avgPct":52.9},{"q":"II.b","avgPct":50.0},{"q":"II.c","avgPct":67.6},{"q":"III.a","avgPct":100.0},{"q":"III.b","avgPct":100.0},{"q":"III.c","avgPct":100.0},{"q":"IV.a","avgPct":88.2},{"q":"IV.b","avgPct":85.3},{"q":"IV.c","avgPct":32.4},{"q":"V.a","avgPct":52.9},{"q":"V.b","avgPct":58.8},{"q":"V.c","avgPct":38.2}]},"4":{"Maths":[{"q":"1","avgPct":27.3},{"q":"2","avgPct":39.4},{"q":"3","avgPct":3.0},{"q":"4","avgPct":66.7},{"q":"5","avgPct":60.6},{"q":"6","avgPct":36.4},{"q":"7","avgPct":69.7},{"q":"8","avgPct":15.2},{"q":"9","avgPct":42.4},{"q":"10","avgPct":39.4},{"q":"11","avgPct":30.3},{"q":"12","avgPct":27.3},{"q":"13","avgPct":93.9},{"q":"14","avgPct":72.7},{"q":"15","avgPct":33.3},{"q":"16","avgPct":57.6},{"q":"17","avgPct":39.4},{"q":"18","avgPct":63.6},{"q":"19","avgPct":51.5},{"q":"20","avgPct":36.4},{"q":"21","avgPct":28.8},{"q":"22","avgPct":21.2},{"q":"23","avgPct":6.1},{"q":"24","avgPct":9.1},{"q":"25","avgPct":3.0},{"q":"26","avgPct":27.3},{"q":"27","avgPct":57.6}],"English":[{"q":"I.a","avgPct":18.2},{"q":"I.b","avgPct":0.0},{"q":"I.c","avgPct":48.5},{"q":"II.a","avgPct":6.1},{"q":"II.b","avgPct":15.2},{"q":"II.c","avgPct":30.3},{"q":"III.a","avgPct":21.2},{"q":"III.b","avgPct":6.1},{"q":"III.c","avgPct":24.2},{"q":"IV.a","avgPct":45.5},{"q":"IV.b","avgPct":33.3},{"q":"IV.c","avgPct":27.3},{"q":"V.a","avgPct":6.1},{"q":"V.b","avgPct":12.1},{"q":"V.c","avgPct":9.1},{"q":"VI.a","avgPct":0.0},{"q":"VI.b","avgPct":3.0},{"q":"VI.c","avgPct":0.0},{"q":"VI.d","avgPct":0.0}]},"5":{"Maths":[{"q":"1","avgPct":33.3},{"q":"2","avgPct":33.3},{"q":"3","avgPct":38.1},{"q":"4","avgPct":47.6},{"q":"5","avgPct":47.6},{"q":"6","avgPct":66.7},{"q":"7","avgPct":38.1},{"q":"8","avgPct":61.9},{"q":"9","avgPct":66.7},{"q":"10","avgPct":90.5},{"q":"11","avgPct":42.9},{"q":"12","avgPct":57.1},{"q":"13","avgPct":85.7},{"q":"14","avgPct":76.2},{"q":"15","avgPct":14.3},{"q":"16","avgPct":61.9},{"q":"17","avgPct":33.3},{"q":"18","avgPct":33.3},{"q":"19","avgPct":85.7},{"q":"20","avgPct":47.6},{"q":"21","avgPct":19.0},{"q":"22","avgPct":9.5},{"q":"23","avgPct":33.3},{"q":"24","avgPct":14.3},{"q":"25","avgPct":33.3},{"q":"26","avgPct":19.0},{"q":"27","avgPct":23.8},{"q":"28","avgPct":31.0},{"q":"29","avgPct":33.3}],"English":[{"q":"I.a","avgPct":28.6},{"q":"I.b","avgPct":14.3},{"q":"I.c","avgPct":9.5},{"q":"II.a","avgPct":61.9},{"q":"II.b","avgPct":52.4},{"q":"II.c","avgPct":14.3},{"q":"III.1","avgPct":19.0},{"q":"III.2","avgPct":9.5},{"q":"III.3","avgPct":9.5},{"q":"IV.1","avgPct":0.0},{"q":"IV.2","avgPct":14.3},{"q":"IV.3","avgPct":4.8},{"q":"V.a","avgPct":61.9},{"q":"V.b","avgPct":0.0},{"q":"V.c","avgPct":9.5},{"q":"VI.1","avgPct":9.5},{"q":"VI.2","avgPct":4.8},{"q":"VI.3","avgPct":0.0},{"q":"VI.4","avgPct":0.0},{"q":"VI.5","avgPct":0.0}]}}},"2017":{"schoolAverages":{"classSubjectCols":["1-E","1-M","2-E","2-M","3-E","3-M","4-E","4-M","5-E","5-M","6-E","6-M"],"schools":[{"schoolId":1,"cells":{"2-M":{"avg":12.07,"max":30,"attempted":14,"total":14},"3-E":{"avg":14.06,"max":20,"attempted":16,"total":16},"3-M":{"avg":11.12,"max":28,"attempted":16,"total":16},"4-E":{"avg":11.56,"max":23,"attempted":9,"total":9},"4-M":{"avg":13.78,"max":30,"attempted":9,"total":9},"5-E":{"avg":5.37,"max":24,"attempted":19,"total":19},"5-M":{"avg":13.37,"max":30,"attempted":19,"total":19}}},{"schoolId":2,"cells":{"2-M":{"avg":5.46,"max":30,"attempted":26,"total":26},"3-E":{"avg":10.44,"max":20,"attempted":27,"total":27},"3-M":{"avg":7.93,"max":28,"attempted":27,"total":27},"4-E":{"avg":11.82,"max":23,"attempted":17,"total":17},"4-M":{"avg":12.06,"max":30,"attempted":17,"total":17},"5-E":{"avg":7.32,"max":24,"attempted":25,"total":25},"5-M":{"avg":14.32,"max":30,"attempted":25,"total":25}}},{"schoolId":3,"cells":{"2-M":{"avg":5.58,"max":30,"attempted":12,"total":12},"3-E":{"avg":11.6,"max":20,"attempted":10,"total":10},"3-M":{"avg":8.6,"max":28,"attempted":10,"total":10},"4-E":{"avg":9.6,"max":23,"attempted":15,"total":15},"4-M":{"avg":7.07,"max":30,"attempted":15,"total":15},"5-E":{"avg":3.7,"max":24,"attempted":10,"total":10},"5-M":{"avg":8.7,"max":30,"attempted":10,"total":10}}},{"schoolId":4,"cells":{"2-M":{"avg":17.0,"max":30,"attempted":4,"total":4},"3-E":{"avg":12.43,"max":20,"attempted":7,"total":7},"3-M":{"avg":11.86,"max":28,"attempted":7,"total":7},"4-E":{"avg":9.0,"max":23,"attempted":5,"total":5},"4-M":{"avg":10.8,"max":30,"attempted":5,"total":5},"5-E":{"avg":10.25,"max":24,"attempted":8,"total":8},"5-M":{"avg":19.62,"max":30,"attempted":8,"total":8}}},{"schoolId":5,"cells":{"2-M":{"avg":2.67,"max":30,"attempted":15,"total":15},"3-E":{"avg":12.74,"max":20,"attempted":23,"total":23},"3-M":{"avg":14.43,"max":28,"attempted":23,"total":23},"4-E":{"avg":10.62,"max":23,"attempted":13,"total":13},"4-M":{"avg":7.38,"max":30,"attempted":13,"total":13},"5-E":{"avg":6.18,"max":24,"attempted":17,"total":17},"5-M":{"avg":11.53,"max":30,"attempted":17,"total":17}}},{"schoolId":6,"cells":{"2-M":{"avg":7.23,"max":30,"attempted":11,"total":11},"3-E":{"avg":16.25,"max":20,"attempted":4,"total":4},"3-M":{"avg":18.0,"max":28,"attempted":4,"total":4},"4-E":{"avg":10.73,"max":23,"attempted":11,"total":11},"4-M":{"avg":13.64,"max":30,"attempted":11,"total":11},"5-E":{"avg":6.67,"max":24,"attempted":12,"total":12},"5-M":{"avg":17.92,"max":30,"attempted":12,"total":12}}},{"schoolId":7,"cells":{"2-M":{"avg":12.62,"max":30,"attempted":12,"total":12},"3-E":{"avg":9.17,"max":20,"attempted":6,"total":6},"3-M":{"avg":13.83,"max":28,"attempted":6,"total":6},"4-E":{"avg":6.45,"max":23,"attempted":11,"total":11},"4-M":{"avg":9.36,"max":30,"attempted":11,"total":11},"5-E":{"avg":2.27,"max":24,"attempted":15,"total":15},"5-M":{"avg":10.47,"max":30,"attempted":15,"total":15}}},{"schoolId":8,"cells":{"2-M":{"avg":16.71,"max":30,"attempted":12,"total":12},"3-E":{"avg":12.5,"max":20,"attempted":8,"total":8},"3-M":{"avg":13.88,"max":28,"attempted":8,"total":8},"4-E":{"avg":11.94,"max":23,"attempted":17,"total":17},"4-M":{"avg":11.12,"max":30,"attempted":17,"total":17},"5-E":{"avg":4.11,"max":24,"attempted":9,"total":9},"5-M":{"avg":15.33,"max":30,"attempted":9,"total":9}}},{"schoolId":9,"cells":{"2-M":{"avg":8.17,"max":30,"attempted":9,"total":9},"3-E":{"avg":11.94,"max":20,"attempted":16,"total":16},"3-M":{"avg":13.19,"max":28,"attempted":16,"total":16},"4-E":{"avg":12.27,"max":23,"attempted":11,"total":11},"4-M":{"avg":8.45,"max":30,"attempted":11,"total":11},"5-E":{"avg":7.16,"max":24,"attempted":19,"total":19},"5-M":{"avg":14.95,"max":30,"attempted":19,"total":19}}},{"schoolId":10,"cells":{"2-M":{"avg":17.12,"max":30,"attempted":13,"total":13},"3-E":{"avg":10.23,"max":20,"attempted":13,"total":13},"3-M":{"avg":9.69,"max":28,"attempted":13,"total":13},"4-E":{"avg":6.33,"max":23,"attempted":6,"total":6},"4-M":{"avg":1.5,"max":30,"attempted":6,"total":6},"5-E":{"avg":5.47,"max":24,"attempted":17,"total":17},"5-M":{"avg":14.82,"max":30,"attempted":17,"total":17}}},{"schoolId":11,"cells":{"2-M":{"avg":10.53,"max":30,"attempted":17,"total":17},"3-E":{"avg":11.18,"max":20,"attempted":17,"total":17},"3-M":{"avg":10.24,"max":28,"attempted":17,"total":17},"4-E":{"avg":8.65,"max":23,"attempted":17,"total":17},"4-M":{"avg":6.65,"max":30,"attempted":17,"total":17},"5-E":{"avg":7.92,"max":24,"attempted":13,"total":13},"5-M":{"avg":13.46,"max":30,"attempted":13,"total":13}}},{"schoolId":12,"cells":{"2-M":{"avg":6.3,"max":30,"attempted":30,"total":30},"3-E":{"avg":8.2,"max":20,"attempted":40,"total":40},"3-M":{"avg":9.67,"max":28,"attempted":39,"total":39},"4-E":{"avg":9.8,"max":23,"attempted":56,"total":56},"4-M":{"avg":9.59,"max":30,"attempted":56,"total":56},"5-E":{"avg":5.59,"max":24,"attempted":46,"total":46},"5-M":{"avg":10.67,"max":30,"attempted":46,"total":46}}},{"schoolId":13,"cells":{"2-M":{"avg":6.5,"max":30,"attempted":16,"total":16},"3-E":{"avg":10.69,"max":20,"attempted":13,"total":13},"3-M":{"avg":14.04,"max":28,"attempted":13,"total":13},"4-E":{"avg":8.42,"max":23,"attempted":19,"total":19},"4-M":{"avg":10.84,"max":30,"attempted":19,"total":19},"5-E":{"avg":6.06,"max":24,"attempted":16,"total":16},"5-M":{"avg":16.62,"max":30,"attempted":16,"total":16}}},{"schoolId":14,"cells":{"2-M":{"avg":11.28,"max":30,"attempted":9,"total":9},"3-E":{"avg":15.43,"max":20,"attempted":14,"total":14},"3-M":{"avg":15.14,"max":28,"attempted":14,"total":14},"4-E":{"avg":9.86,"max":23,"attempted":7,"total":7},"4-M":{"avg":10.71,"max":30,"attempted":7,"total":7},"5-E":{"avg":7.88,"max":24,"attempted":8,"total":8},"5-M":{"avg":15.75,"max":30,"attempted":8,"total":8}}},{"schoolId":18,"cells":{"2-M":{"avg":19.0,"max":30,"attempted":2,"total":2},"3-E":{"avg":8.71,"max":20,"attempted":7,"total":7},"3-M":{"avg":9.14,"max":28,"attempted":7,"total":7},"4-E":{"avg":7.25,"max":23,"attempted":8,"total":8},"4-M":{"avg":11.12,"max":30,"attempted":8,"total":8},"5-E":{"avg":5.71,"max":24,"attempted":7,"total":7},"5-M":{"avg":20.0,"max":30,"attempted":7,"total":7}}},{"schoolId":20,"cells":{"2-M":{"avg":9.5,"max":30,"attempted":9,"total":9},"3-E":{"avg":10.4,"max":20,"attempted":5,"total":5},"3-M":{"avg":9.2,"max":28,"attempted":5,"total":5},"4-E":{"avg":8.78,"max":23,"attempted":9,"total":9},"4-M":{"avg":7.78,"max":30,"attempted":9,"total":9},"5-E":{"avg":2.07,"max":24,"attempted":14,"total":14},"5-M":{"avg":10.29,"max":30,"attempted":14,"total":14}}},{"schoolId":22,"cells":{"2-M":{"avg":12.67,"max":30,"attempted":3,"total":3},"3-E":{"avg":12.71,"max":20,"attempted":7,"total":7},"3-M":{"avg":17.57,"max":28,"attempted":7,"total":7},"4-E":{"avg":8.6,"max":23,"attempted":5,"total":5},"4-M":{"avg":14.2,"max":30,"attempted":5,"total":5},"5-E":{"avg":8.86,"max":24,"attempted":7,"total":7},"5-M":{"avg":21.14,"max":30,"attempted":7,"total":7}}},{"schoolId":23,"cells":{"2-M":{"avg":15.23,"max":30,"attempted":11,"total":11},"3-E":{"avg":15.33,"max":20,"attempted":6,"total":6},"3-M":{"avg":14.83,"max":28,"attempted":6,"total":6},"4-E":{"avg":12.0,"max":23,"attempted":9,"total":9},"4-M":{"avg":10.78,"max":30,"attempted":9,"total":9},"5-E":{"avg":2.0,"max":24,"attempted":5,"total":5},"5-M":{"avg":15.2,"max":30,"attempted":5,"total":5}}},{"schoolId":24,"cells":{"2-M":{"avg":11.0,"max":30,"attempted":2,"total":2},"3-E":{"avg":9.43,"max":20,"attempted":7,"total":7},"3-M":{"avg":14.71,"max":28,"attempted":7,"total":7},"4-E":{"avg":6.4,"max":23,"attempted":5,"total":5},"4-M":{"avg":11.2,"max":30,"attempted":5,"total":5},"5-E":{"avg":2.71,"max":24,"attempted":14,"total":14},"5-M":{"avg":10.64,"max":30,"attempted":14,"total":14}}},{"schoolId":25,"cells":{"2-M":{"avg":22.0,"max":30,"attempted":1,"total":1},"3-E":{"avg":14.5,"max":20,"attempted":2,"total":2},"3-M":{"avg":15.5,"max":28,"attempted":2,"total":2},"4-E":{"avg":14.4,"max":23,"attempted":5,"total":5},"4-M":{"avg":13.2,"max":30,"attempted":5,"total":5},"5-E":{"avg":0.0,"max":24,"attempted":1,"total":1},"5-M":{"avg":6.0,"max":30,"attempted":1,"total":1}}},{"schoolId":26,"cells":{"2-M":{"avg":6.69,"max":30,"attempted":16,"total":16},"3-E":{"avg":10.87,"max":20,"attempted":15,"total":15},"3-M":{"avg":12.17,"max":28,"attempted":15,"total":15},"4-E":{"avg":12.12,"max":23,"attempted":8,"total":8},"4-M":{"avg":14.88,"max":30,"attempted":8,"total":8},"5-E":{"avg":5.6,"max":24,"attempted":20,"total":20},"5-M":{"avg":13.05,"max":30,"attempted":20,"total":20}}},{"schoolId":37,"cells":{"2-M":{"avg":5.83,"max":30,"attempted":6,"total":6},"3-E":{"avg":11.33,"max":20,"attempted":3,"total":3},"3-M":{"avg":7.67,"max":28,"attempted":3,"total":3},"4-E":{"avg":10.5,"max":23,"attempted":6,"total":6},"4-M":{"avg":9.83,"max":30,"attempted":6,"total":6},"5-E":{"avg":10.75,"max":24,"attempted":4,"total":4},"5-M":{"avg":17.75,"max":30,"attempted":4,"total":4}}},{"schoolId":38,"cells":{"2-M":{"avg":17.0,"max":30,"attempted":1,"total":1},"3-E":{"avg":18.2,"max":20,"attempted":5,"total":5},"3-M":{"avg":22.4,"max":28,"attempted":5,"total":5},"4-E":{"avg":17.67,"max":23,"attempted":3,"total":3},"4-M":{"avg":19.67,"max":30,"attempted":3,"total":3},"5-E":{"avg":13.67,"max":24,"attempted":6,"total":6},"5-M":{"avg":19.17,"max":30,"attempted":6,"total":6}}},{"schoolId":44,"cells":{"2-M":{"avg":11.38,"max":30,"attempted":12,"total":12},"3-E":{"avg":4.05,"max":20,"attempted":19,"total":19},"3-M":{"avg":4.32,"max":28,"attempted":19,"total":19},"4-E":{"avg":4.0,"max":23,"attempted":16,"total":16},"4-M":{"avg":4.81,"max":30,"attempted":16,"total":16},"5-E":{"avg":1.35,"max":24,"attempted":20,"total":20},"5-M":{"avg":8.35,"max":30,"attempted":20,"total":20}}},{"schoolId":45,"cells":{"2-M":{"avg":5.53,"max":30,"attempted":16,"total":16},"3-E":{"avg":7.19,"max":20,"attempted":26,"total":26},"3-M":{"avg":8.08,"max":28,"attempted":26,"total":26},"4-E":{"avg":7.33,"max":23,"attempted":24,"total":24},"4-M":{"avg":7.12,"max":30,"attempted":24,"total":24},"5-E":{"avg":4.85,"max":24,"attempted":20,"total":20},"5-M":{"avg":11.15,"max":30,"attempted":20,"total":20}}},{"schoolId":49,"cells":{"2-M":{"avg":10.5,"max":30,"attempted":14,"total":14},"3-E":{"avg":12.2,"max":20,"attempted":10,"total":10},"3-M":{"avg":13.1,"max":28,"attempted":10,"total":10},"4-E":{"avg":10.18,"max":23,"attempted":11,"total":11},"4-M":{"avg":10.82,"max":30,"attempted":11,"total":11},"5-E":{"avg":4.23,"max":24,"attempted":13,"total":13},"5-M":{"avg":12.92,"max":30,"attempted":13,"total":13}}},{"schoolId":50,"cells":{"3-E":{"avg":18.0,"max":20,"attempted":1,"total":1},"3-M":{"avg":22.0,"max":28,"attempted":1,"total":1},"4-E":{"avg":17.5,"max":23,"attempted":2,"total":2},"4-M":{"avg":15.5,"max":30,"attempted":2,"total":2},"5-E":{"avg":6.0,"max":24,"attempted":4,"total":4},"5-M":{"avg":16.0,"max":30,"attempted":4,"total":4}}},{"schoolId":51,"cells":{"2-M":{"avg":10.19,"max":30,"attempted":8,"total":8},"3-E":{"avg":12.0,"max":20,"attempted":1,"total":1},"3-M":{"avg":12.0,"max":28,"attempted":1,"total":1},"4-E":{"avg":15.8,"max":23,"attempted":5,"total":5},"4-M":{"avg":18.0,"max":30,"attempted":5,"total":5},"5-E":{"avg":12.17,"max":24,"attempted":6,"total":6},"5-M":{"avg":19.17,"max":30,"attempted":6,"total":6}}},{"schoolId":53,"cells":{"2-M":{"avg":14.86,"max":30,"attempted":7,"total":7},"3-E":{"avg":12.0,"max":20,"attempted":1,"total":1},"3-M":{"avg":13.0,"max":28,"attempted":1,"total":1}}},{"schoolId":54,"cells":{"2-M":{"avg":18.06,"max":30,"attempted":16,"total":16},"3-E":{"avg":10.32,"max":20,"attempted":19,"total":19},"3-M":{"avg":12.26,"max":28,"attempted":19,"total":19},"4-E":{"avg":7.69,"max":23,"attempted":16,"total":16},"4-M":{"avg":9.06,"max":30,"attempted":16,"total":16},"5-E":{"avg":5.88,"max":24,"attempted":8,"total":8},"5-M":{"avg":13.25,"max":30,"attempted":8,"total":8}}},{"schoolId":63,"cells":{"2-M":{"avg":8.42,"max":30,"attempted":6,"total":6},"3-E":{"avg":8.71,"max":20,"attempted":14,"total":14},"3-M":{"avg":7.14,"max":28,"attempted":14,"total":14},"4-E":{"avg":7.75,"max":23,"attempted":8,"total":8},"4-M":{"avg":5.12,"max":30,"attempted":8,"total":8},"5-E":{"avg":3.46,"max":24,"attempted":13,"total":13},"5-M":{"avg":9.85,"max":30,"attempted":13,"total":13}}},{"schoolId":66,"cells":{"2-M":{"avg":23.35,"max":30,"attempted":10,"total":10},"3-E":{"avg":15.0,"max":20,"attempted":5,"total":5},"3-M":{"avg":17.2,"max":28,"attempted":5,"total":5},"4-E":{"avg":14.25,"max":23,"attempted":16,"total":16},"4-M":{"avg":15.25,"max":30,"attempted":16,"total":16},"5-E":{"avg":11.71,"max":24,"attempted":7,"total":7},"5-M":{"avg":22.57,"max":30,"attempted":7,"total":7}}},{"schoolId":67,"cells":{"2-M":{"avg":12.18,"max":30,"attempted":11,"total":11},"3-E":{"avg":15.17,"max":20,"attempted":6,"total":6},"3-M":{"avg":17.0,"max":28,"attempted":6,"total":6},"4-E":{"avg":16.17,"max":23,"attempted":6,"total":6},"4-M":{"avg":16.0,"max":30,"attempted":6,"total":6},"5-E":{"avg":9.75,"max":24,"attempted":4,"total":4},"5-M":{"avg":19.25,"max":30,"attempted":4,"total":4}}},{"schoolId":69,"cells":{"2-M":{"avg":10.54,"max":30,"attempted":23,"total":23},"3-E":{"avg":11.45,"max":20,"attempted":22,"total":22},"3-M":{"avg":13.59,"max":28,"attempted":22,"total":22},"4-E":{"avg":10.05,"max":23,"attempted":21,"total":21},"4-M":{"avg":14.29,"max":30,"attempted":21,"total":21},"5-E":{"avg":4.08,"max":24,"attempted":26,"total":26},"5-M":{"avg":15.92,"max":30,"attempted":26,"total":26}}}]},"oralStatus":{"English":[{"class":1,"Pre Letter":59.87,"Capital Letter":13.16,"Small Letter":26.97,"Read Words":0.0,"Understand Words":0.0,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":16.67,"Capital Letter":8.33,"Small Letter":52.78,"Read Words":8.89,"Understand Words":10.0,"Read Sentence":2.22,"Understand Sentence":1.11,"Direct Test":0.0},{"class":3,"Pre Letter":8.56,"Capital Letter":3.6,"Small Letter":36.04,"Read Words":13.06,"Understand Words":13.96,"Read Sentence":9.01,"Understand Sentence":7.21,"Direct Test":0.45},{"class":4,"Pre Letter":3.33,"Capital Letter":1.9,"Small Letter":31.9,"Read Words":11.9,"Understand Words":11.43,"Read Sentence":21.9,"Understand Sentence":9.05,"Direct Test":0.0},{"class":5,"Pre Letter":0.42,"Capital Letter":1.67,"Small Letter":34.17,"Read Words":13.33,"Understand Words":11.25,"Read Sentence":22.08,"Understand Sentence":11.67,"Direct Test":0.0},{"class":6,"Pre Letter":11.11,"Capital Letter":0.0,"Small Letter":11.11,"Read Words":33.33,"Understand Words":0.0,"Read Sentence":33.33,"Understand Sentence":11.11,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":34.87,"One Digit Numbers":61.18,"Two Digit Numbers":2.63,"Addition":1.32,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":5.85,"One Digit Numbers":29.76,"Two Digit Numbers":19.02,"Addition":31.22,"Subtraction":1.95,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":2.25,"One Digit Numbers":12.61,"Two Digit Numbers":7.66,"Addition":48.2,"Subtraction":20.72,"Multiplication":0.0,"Division":0.0},{"class":4,"Pre Numbers":1.43,"One Digit Numbers":6.19,"Two Digit Numbers":7.62,"Addition":31.43,"Subtraction":24.29,"Multiplication":10.0,"Division":10.48},{"class":5,"Pre Numbers":0.0,"One Digit Numbers":4.17,"Two Digit Numbers":2.92,"Addition":31.25,"Subtraction":23.33,"Multiplication":9.58,"Division":23.33},{"class":6,"Pre Numbers":0.0,"One Digit Numbers":11.11,"Two Digit Numbers":0.0,"Addition":22.22,"Subtraction":0.0,"Multiplication":11.11,"Division":55.56}],"Tamil":[{"class":1,"Letter":53.47,"Word":2.78,"Sentence":0.0,"Paragraph":0.0},{"class":2,"Letter":35.71,"Word":47.02,"Sentence":8.33,"Paragraph":0.0},{"class":3,"Letter":16.92,"Word":38.97,"Sentence":28.72,"Paragraph":9.23},{"class":4,"Letter":9.71,"Word":17.71,"Sentence":40.0,"Paragraph":28.0},{"class":5,"Letter":4.13,"Word":12.84,"Sentence":38.53,"Paragraph":44.04},{"class":6,"Letter":0.0,"Word":0.0,"Sentence":44.44,"Paragraph":44.44}]},"overallScores":{"English":[{"class":1,"writtenScorePct":null,"oralProgressPct":9.6},{"class":2,"writtenScorePct":null,"oralProgressPct":28.3},{"class":3,"writtenScorePct":60.4,"oralProgressPct":40.8},{"class":4,"writtenScorePct":46.4,"oralProgressPct":48.6},{"class":5,"writtenScorePct":24.5,"oralProgressPct":50.7},{"class":6,"writtenScorePct":null,"oralProgressPct":50.8}],"Maths":[{"class":1,"writtenScorePct":null,"oralProgressPct":11.7},{"class":2,"writtenScorePct":38.1,"oralProgressPct":32.1},{"class":3,"writtenScorePct":45.8,"oralProgressPct":46.6},{"class":4,"writtenScorePct":37.0,"oralProgressPct":59.4},{"class":5,"writtenScorePct":47.9,"oralProgressPct":67.8},{"class":6,"writtenScorePct":null,"oralProgressPct":77.8}],"Tamil":[{"class":1,"writtenScorePct":null,"oralProgressPct":1.6},{"class":2,"writtenScorePct":null,"oralProgressPct":23.3},{"class":3,"writtenScorePct":null,"oralProgressPct":44.1},{"class":4,"writtenScorePct":null,"oralProgressPct":63.5},{"class":5,"writtenScorePct":null,"oralProgressPct":74.3},{"class":6,"writtenScorePct":null,"oralProgressPct":83.3}]},"oralProgression":{"English":[{"class":1,"Pre Letter":100.0,"Capital Letter":40.1,"Small Letter":27.0,"Read Words":0.0,"Understand Words":0.0,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":100.0,"Capital Letter":83.3,"Small Letter":75.0,"Read Words":22.2,"Understand Words":13.3,"Read Sentence":3.3,"Understand Sentence":1.1,"Direct Test":0.0},{"class":3,"Pre Letter":91.9,"Capital Letter":83.3,"Small Letter":79.7,"Read Words":43.7,"Understand Words":30.6,"Read Sentence":16.7,"Understand Sentence":7.7,"Direct Test":0.5},{"class":4,"Pre Letter":91.4,"Capital Letter":88.1,"Small Letter":86.2,"Read Words":54.3,"Understand Words":42.4,"Read Sentence":31.0,"Understand Sentence":9.0,"Direct Test":0.0},{"class":5,"Pre Letter":94.6,"Capital Letter":94.2,"Small Letter":92.5,"Read Words":58.3,"Understand Words":45.0,"Read Sentence":33.8,"Understand Sentence":11.7,"Direct Test":0.0},{"class":6,"Pre Letter":100.0,"Capital Letter":88.9,"Small Letter":88.9,"Read Words":77.8,"Understand Words":44.4,"Read Sentence":44.4,"Understand Sentence":11.1,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":100.0,"One Digit Numbers":65.1,"Two Digit Numbers":3.9,"Addition":1.3,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":87.8,"One Digit Numbers":82.0,"Two Digit Numbers":52.2,"Addition":33.2,"Subtraction":2.0,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":91.4,"One Digit Numbers":89.2,"Two Digit Numbers":76.6,"Addition":68.9,"Subtraction":20.7,"Multiplication":0.0,"Division":0.0},{"class":4,"Pre Numbers":91.4,"One Digit Numbers":90.0,"Two Digit Numbers":83.8,"Addition":76.2,"Subtraction":44.8,"Multiplication":20.5,"Division":10.5},{"class":5,"Pre Numbers":94.6,"One Digit Numbers":94.6,"Two Digit Numbers":90.4,"Addition":87.5,"Subtraction":56.2,"Multiplication":32.9,"Division":23.3},{"class":6,"Pre Numbers":100.0,"One Digit Numbers":100.0,"Two Digit Numbers":88.9,"Addition":88.9,"Subtraction":66.7,"Multiplication":66.7,"Division":55.6}],"Tamil":[{"class":1,"Letter":56.2,"Word":2.8,"Sentence":0.0,"Paragraph":0.0},{"class":2,"Letter":91.1,"Word":55.4,"Sentence":8.3,"Paragraph":0.0},{"class":3,"Letter":93.8,"Word":76.9,"Sentence":37.9,"Paragraph":9.2},{"class":4,"Letter":95.4,"Word":85.7,"Sentence":68.0,"Paragraph":28.0},{"class":5,"Letter":99.5,"Word":95.4,"Sentence":82.6,"Paragraph":44.0},{"class":6,"Letter":88.9,"Word":88.9,"Sentence":88.9,"Paragraph":44.4}]},"writtenQuestionwise":{"2":{"Maths":[{"q":"1.i","avgPct":52.8},{"q":"1.ii","avgPct":47.2},{"q":"2","avgPct":20.8},{"q":"3","avgPct":26.4},{"q":"4.i","avgPct":44.4},{"q":"4.ii","avgPct":41.7},{"q":"5.i","avgPct":41.7},{"q":"5.ii","avgPct":41.7},{"q":"6.i","avgPct":50.0},{"q":"6.ii","avgPct":47.2},{"q":"6.iii","avgPct":16.7},{"q":"7.i.","avgPct":44.4},{"q":"7.ii","avgPct":27.8},{"q":"7.iii","avgPct":25.0},{"q":"7.iv","avgPct":16.7},{"q":"7.v","avgPct":41.7},{"q":"8","avgPct":63.9},{"q":"9","avgPct":13.9},{"q":"10.i","avgPct":22.2},{"q":"10.ii","avgPct":27.8},{"q":"11.i","avgPct":4.2},{"q":"11.ii","avgPct":2.8},{"q":"12.i","avgPct":33.3},{"q":"12.ii","avgPct":41.7},{"q":"13.i","avgPct":20.8},{"q":"13.ii","avgPct":16.7}]},"3":{"Maths":[{"q":"1","avgPct":66.7},{"q":"2","avgPct":46.7},{"q":"3.i","avgPct":70.0},{"q":"3.ii","avgPct":50.0},{"q":"4.i","avgPct":80.0},{"q":"4.ii","avgPct":40.0},{"q":"5.i","avgPct":26.7},{"q":"5.ii","avgPct":30.0},{"q":"6","avgPct":40.0},{"q":"7","avgPct":56.7},{"q":"8","avgPct":43.3},{"q":"9.i","avgPct":56.7},{"q":"9.ii","avgPct":50.0},{"q":"10","avgPct":53.3},{"q":"11","avgPct":26.7},{"q":"12.i","avgPct":80.0},{"q":"12.ii","avgPct":26.7},{"q":"13.i","avgPct":96.7},{"q":"13.ii","avgPct":63.3},{"q":"13.iii","avgPct":66.7},{"q":"13.iv","avgPct":76.7},{"q":"13.v","avgPct":26.7},{"q":"14","avgPct":30.0},{"q":"15","avgPct":30.0},{"q":"16","avgPct":25.0},{"q":"17","avgPct":38.3}],"English":[{"q":"I.a","avgPct":70.0},{"q":"I.b","avgPct":43.3},{"q":"I.c","avgPct":80.0},{"q":"I.d","avgPct":66.7},{"q":"II.a","avgPct":43.3},{"q":"II.b","avgPct":70.0},{"q":"II.c","avgPct":63.3},{"q":"II.d","avgPct":66.7},{"q":"III.a","avgPct":96.7},{"q":"III.b","avgPct":93.3},{"q":"III.c","avgPct":96.7},{"q":"III.d","avgPct":93.3},{"q":"IV.a","avgPct":73.3},{"q":"IV.b","avgPct":43.3},{"q":"IV.c","avgPct":30.0},{"q":"IV.d","avgPct":66.7},{"q":"V.a","avgPct":86.7},{"q":"V.b","avgPct":53.3},{"q":"V.c","avgPct":53.3},{"q":"V.d","avgPct":66.7}]},"4":{"Maths":[{"q":"1.i","avgPct":7.3},{"q":"1.ii","avgPct":17.1},{"q":"1.iii","avgPct":9.8},{"q":"1.iv","avgPct":19.5},{"q":"2.i","avgPct":36.6},{"q":"2.ii","avgPct":22.0},{"q":"3.i","avgPct":56.1},{"q":"3.ii","avgPct":53.7},{"q":"4","avgPct":70.7},{"q":"5","avgPct":59.8},{"q":"6.i","avgPct":34.1},{"q":"6.ii","avgPct":41.5},{"q":"7.i","avgPct":58.5},{"q":"7.ii","avgPct":36.6},{"q":"7.iii","avgPct":14.6},{"q":"7.iv","avgPct":51.2},{"q":"7.v","avgPct":41.5},{"q":"7.vi","avgPct":19.5},{"q":"8","avgPct":11.0},{"q":"9","avgPct":9.8},{"q":"10","avgPct":6.1},{"q":"11","avgPct":65.9},{"q":"12","avgPct":34.1},{"q":"13","avgPct":19.5},{"q":"14","avgPct":22.0}],"English":[{"q":"I.a","avgPct":70.7},{"q":"I.b","avgPct":68.3},{"q":"I.c","avgPct":48.8},{"q":"I.d","avgPct":56.1},{"q":"II.a","avgPct":61.0},{"q":"II.b","avgPct":46.3},{"q":"II.c","avgPct":43.9},{"q":"II.d","avgPct":68.3},{"q":"III.a","avgPct":68.3},{"q":"III.b","avgPct":73.2},{"q":"III.c","avgPct":41.5},{"q":"III.d","avgPct":36.6},{"q":"IV.a","avgPct":75.6},{"q":"IV.b","avgPct":58.5},{"q":"IV.c","avgPct":61.0},{"q":"V.a","avgPct":48.8},{"q":"V.b","avgPct":36.6},{"q":"V.c","avgPct":41.5},{"q":"V.d","avgPct":68.3},{"q":"VI.a","avgPct":61.0},{"q":"VI.b","avgPct":7.3},{"q":"VI.c","avgPct":17.1}]},"5":{"Maths":[{"q":"1","avgPct":52.8},{"q":"2","avgPct":63.9},{"q":"3","avgPct":47.2},{"q":"4","avgPct":50.0},{"q":"5.i","avgPct":77.8},{"q":"5.ii","avgPct":50.0},{"q":"5.iii","avgPct":30.6},{"q":"5.iv","avgPct":30.6},{"q":"5.v","avgPct":19.4},{"q":"6","avgPct":63.9},{"q":"7","avgPct":44.4},{"q":"8","avgPct":97.2},{"q":"9","avgPct":25.0},{"q":"10.i","avgPct":86.1},{"q":"10.ii","avgPct":83.3},{"q":"10.iii","avgPct":83.3},{"q":"11","avgPct":33.3},{"q":"12","avgPct":22.2},{"q":"13","avgPct":31.9},{"q":"14","avgPct":33.3},{"q":"15.i","avgPct":22.2},{"q":"15.ii","avgPct":44.4},{"q":"15.iii","avgPct":44.4},{"q":"15.iv","avgPct":66.7},{"q":"15.v","avgPct":38.9}],"English":[{"q":"I.a","avgPct":30.6},{"q":"I.b","avgPct":16.7},{"q":"I.c","avgPct":22.2},{"q":"II.a","avgPct":19.4},{"q":"II.b","avgPct":75.0},{"q":"II.c","avgPct":50.0},{"q":"II.d","avgPct":66.7},{"q":"III.1","avgPct":30.6},{"q":"III.2","avgPct":2.8},{"q":"III.3","avgPct":8.3},{"q":"III.4","avgPct":0.0},{"q":"III.5","avgPct":2.8},{"q":"IV.1","avgPct":44.4},{"q":"IV.2","avgPct":11.1},{"q":"IV.3","avgPct":33.3},{"q":"IV.4","avgPct":52.8},{"q":"V.a","avgPct":0.0},{"q":"V.b","avgPct":0.0},{"q":"V.c","avgPct":0.0},{"q":"V.d","avgPct":0.0},{"q":"VI.1","avgPct":30.6},{"q":"VI.2","avgPct":27.8},{"q":"VI.3","avgPct":5.6},{"q":"VI.4","avgPct":52.8}]}}},"2018":{"schoolAverages":{"classSubjectCols":["1-E","1-M","2-E","2-M","3-E","3-M","4-E","4-M","5-E","5-M","6-E","6-M"],"schools":[{"schoolId":1,"cells":{"2-E":{"avg":7.79,"max":12,"attempted":12,"total":12},"2-M":{"avg":8.83,"max":22,"attempted":12,"total":12},"3-E":{"avg":10.07,"max":18,"attempted":14,"total":14},"3-M":{"avg":13.07,"max":34,"attempted":14,"total":14},"5-E":{"avg":9.5,"max":25,"attempted":8,"total":8},"5-M":{"avg":16.38,"max":34,"attempted":8,"total":8}}},{"schoolId":2,"cells":{"2-E":{"avg":6.93,"max":12,"attempted":22,"total":22},"2-M":{"avg":7.5,"max":22,"attempted":22,"total":22},"3-E":{"avg":5.92,"max":18,"attempted":26,"total":26},"3-M":{"avg":6.5,"max":34,"attempted":26,"total":26},"5-E":{"avg":12.03,"max":25,"attempted":16,"total":16},"5-M":{"avg":14.88,"max":34,"attempted":16,"total":16}}},{"schoolId":3,"cells":{"3-E":{"avg":4.25,"max":18,"attempted":12,"total":12},"3-M":{"avg":8.75,"max":34,"attempted":12,"total":12},"4-E":{"avg":10.0,"max":26,"attempted":11,"total":11},"4-M":{"avg":10.59,"max":31,"attempted":11,"total":11},"5-E":{"avg":9.72,"max":25,"attempted":16,"total":16},"5-M":{"avg":13.75,"max":34,"attempted":16,"total":16}}},{"schoolId":4,"cells":{"3-E":{"avg":10.0,"max":18,"attempted":6,"total":6},"3-M":{"avg":13.92,"max":34,"attempted":6,"total":6},"4-E":{"avg":7.88,"max":26,"attempted":8,"total":8},"4-M":{"avg":9.56,"max":31,"attempted":8,"total":8},"5-E":{"avg":6.71,"max":25,"attempted":7,"total":7},"5-M":{"avg":8.71,"max":34,"attempted":7,"total":7}}},{"schoolId":5,"cells":{"2-E":{"avg":7.57,"max":12,"attempted":7,"total":7},"2-M":{"avg":11.14,"max":22,"attempted":7,"total":7},"3-E":{"avg":6.18,"max":18,"attempted":17,"total":17},"3-M":{"avg":11.47,"max":34,"attempted":17,"total":17},"4-E":{"avg":15.3,"max":26,"attempted":23,"total":23},"4-M":{"avg":18.85,"max":31,"attempted":23,"total":23},"5-E":{"avg":8.97,"max":25,"attempted":16,"total":16},"5-M":{"avg":10.88,"max":34,"attempted":16,"total":16}}},{"schoolId":6,"cells":{"2-E":{"avg":11.5,"max":12,"attempted":4,"total":4},"2-M":{"avg":13.25,"max":22,"attempted":4,"total":4},"4-E":{"avg":17.6,"max":26,"attempted":5,"total":5},"4-M":{"avg":24.0,"max":31,"attempted":5,"total":5},"5-E":{"avg":13.95,"max":25,"attempted":11,"total":11},"5-M":{"avg":23.45,"max":34,"attempted":11,"total":11}}},{"schoolId":7,"cells":{"2-E":{"avg":8.07,"max":12,"attempted":7,"total":7},"2-M":{"avg":9.75,"max":22,"attempted":8,"total":8},"4-E":{"avg":7.55,"max":26,"attempted":11,"total":11},"4-M":{"avg":6.5,"max":31,"attempted":11,"total":11},"5-E":{"avg":8.56,"max":25,"attempted":9,"total":9},"5-M":{"avg":10.33,"max":34,"attempted":9,"total":9}}},{"schoolId":8,"cells":{"2-E":{"avg":8.12,"max":12,"attempted":4,"total":4},"2-M":{"avg":13.5,"max":22,"attempted":4,"total":4},"4-E":{"avg":8.38,"max":26,"attempted":8,"total":8},"4-M":{"avg":8.88,"max":31,"attempted":8,"total":8},"5-E":{"avg":9.75,"max":25,"attempted":16,"total":16},"5-M":{"avg":15.94,"max":34,"attempted":16,"total":16}}},{"schoolId":9,"cells":{"3-E":{"avg":4.22,"max":18,"attempted":9,"total":9},"3-M":{"avg":10.11,"max":34,"attempted":9,"total":9},"4-E":{"avg":8.22,"max":26,"attempted":18,"total":18},"4-M":{"avg":8.22,"max":31,"attempted":18,"total":18},"5-E":{"avg":8.2,"max":25,"attempted":10,"total":10},"5-M":{"avg":12.4,"max":34,"attempted":10,"total":10}}},{"schoolId":10,"cells":{"2-E":{"avg":10.7,"max":12,"attempted":5,"total":5},"2-M":{"avg":17.0,"max":22,"attempted":5,"total":5},"3-E":{"avg":13.82,"max":18,"attempted":11,"total":11},"3-M":{"avg":19.45,"max":34,"attempted":11,"total":11},"4-E":{"avg":17.33,"max":26,"attempted":12,"total":12},"4-M":{"avg":17.33,"max":31,"attempted":12,"total":12},"5-E":{"avg":4.67,"max":25,"attempted":3,"total":3},"5-M":{"avg":7.67,"max":34,"attempted":3,"total":3}}},{"schoolId":11,"cells":{"2-E":{"avg":5.0,"max":12,"attempted":14,"total":14},"2-M":{"avg":5.21,"max":22,"attempted":14,"total":14},"3-E":{"avg":3.47,"max":18,"attempted":15,"total":15},"3-M":{"avg":6.67,"max":34,"attempted":15,"total":15},"4-E":{"avg":6.06,"max":26,"attempted":17,"total":17},"4-M":{"avg":5.06,"max":31,"attempted":17,"total":17}}},{"schoolId":12,"cells":{"2-E":{"avg":6.14,"max":12,"attempted":40,"total":40},"2-M":{"avg":5.28,"max":22,"attempted":40,"total":40},"3-E":{"avg":5.1,"max":18,"attempted":20,"total":20},"3-M":{"avg":8.28,"max":34,"attempted":20,"total":20},"4-E":{"avg":8.51,"max":26,"attempted":35,"total":35},"4-M":{"avg":6.56,"max":31,"attempted":35,"total":35},"5-E":{"avg":6.79,"max":25,"attempted":59,"total":59},"5-M":{"avg":9.75,"max":34,"attempted":61,"total":61}}},{"schoolId":13,"cells":{"2-E":{"avg":4.92,"max":12,"attempted":18,"total":18},"2-M":{"avg":8.22,"max":22,"attempted":18,"total":18},"3-E":{"avg":2.19,"max":18,"attempted":16,"total":16},"3-M":{"avg":12.47,"max":34,"attempted":16,"total":16},"4-E":{"avg":10.07,"max":26,"attempted":14,"total":14},"4-M":{"avg":15.43,"max":31,"attempted":14,"total":14},"5-E":{"avg":5.86,"max":25,"attempted":14,"total":14},"5-M":{"avg":9.07,"max":34,"attempted":14,"total":14}}},{"schoolId":14,"cells":{"2-E":{"avg":5.78,"max":12,"attempted":9,"total":9},"2-M":{"avg":6.67,"max":22,"attempted":9,"total":9},"3-E":{"avg":8.07,"max":18,"attempted":14,"total":14},"3-M":{"avg":11.68,"max":34,"attempted":14,"total":14},"5-E":{"avg":2.78,"max":25,"attempted":9,"total":9},"5-M":{"avg":7.0,"max":34,"attempted":9,"total":9}}},{"schoolId":18,"cells":{"2-E":{"avg":9.5,"max":12,"attempted":5,"total":5},"2-M":{"avg":14.8,"max":22,"attempted":5,"total":5},"3-E":{"avg":9.0,"max":18,"attempted":2,"total":2},"3-M":{"avg":14.75,"max":34,"attempted":2,"total":2},"4-E":{"avg":14.86,"max":26,"attempted":7,"total":7},"4-M":{"avg":17.43,"max":31,"attempted":7,"total":7},"5-E":{"avg":11.86,"max":25,"attempted":7,"total":7},"5-M":{"avg":21.57,"max":34,"attempted":7,"total":7}}},{"schoolId":20,"cells":{"2-E":{"avg":5.0,"max":12,"attempted":8,"total":8},"2-M":{"avg":7.12,"max":22,"attempted":8,"total":8},"3-E":{"avg":5.25,"max":18,"attempted":8,"total":8},"3-M":{"avg":9.81,"max":34,"attempted":8,"total":8},"5-E":{"avg":9.25,"max":25,"attempted":8,"total":8},"5-M":{"avg":10.12,"max":34,"attempted":8,"total":8}}},{"schoolId":22,"cells":{"2-E":{"avg":10.0,"max":12,"attempted":3,"total":3},"2-M":{"avg":11.67,"max":22,"attempted":3,"total":3},"3-E":{"avg":9.0,"max":18,"attempted":5,"total":5},"3-M":{"avg":10.0,"max":34,"attempted":5,"total":5},"4-E":{"avg":16.86,"max":26,"attempted":7,"total":7},"4-M":{"avg":15.43,"max":31,"attempted":7,"total":7},"5-E":{"avg":10.83,"max":25,"attempted":6,"total":6},"5-M":{"avg":22.5,"max":34,"attempted":6,"total":6}}},{"schoolId":23,"cells":{"2-E":{"avg":11.06,"max":12,"attempted":8,"total":8},"2-M":{"avg":19.5,"max":22,"attempted":8,"total":8},"3-E":{"avg":10.0,"max":18,"attempted":11,"total":11},"3-M":{"avg":19.77,"max":34,"attempted":11,"total":11},"4-E":{"avg":19.83,"max":26,"attempted":6,"total":6},"4-M":{"avg":22.3,"max":31,"attempted":5,"total":5},"5-E":{"avg":14.78,"max":25,"attempted":9,"total":9},"5-M":{"avg":24.56,"max":34,"attempted":9,"total":9}}},{"schoolId":24,"cells":{"2-E":{"avg":6.25,"max":12,"attempted":2,"total":2},"2-M":{"avg":10.5,"max":22,"attempted":2,"total":2},"3-E":{"avg":5.0,"max":18,"attempted":2,"total":2},"3-M":{"avg":15.75,"max":34,"attempted":2,"total":2},"4-E":{"avg":11.0,"max":26,"attempted":6,"total":6},"4-M":{"avg":14.67,"max":31,"attempted":6,"total":6},"5-E":{"avg":8.1,"max":25,"attempted":5,"total":5},"5-M":{"avg":10.6,"max":34,"attempted":5,"total":5}}},{"schoolId":25,"cells":{"2-E":{"avg":4.5,"max":12,"attempted":3,"total":3},"2-M":{"avg":5.67,"max":22,"attempted":3,"total":3},"3-E":{"avg":9.0,"max":18,"attempted":1,"total":1},"3-M":{"avg":15.5,"max":34,"attempted":1,"total":1},"4-E":{"avg":11.67,"max":26,"attempted":3,"total":3},"4-M":{"avg":13.33,"max":31,"attempted":3,"total":3},"5-E":{"avg":12.3,"max":25,"attempted":5,"total":5},"5-M":{"avg":18.0,"max":34,"attempted":5,"total":5}}},{"schoolId":26,"cells":{"3-E":{"avg":5.24,"max":18,"attempted":17,"total":17},"3-M":{"avg":12.29,"max":34,"attempted":17,"total":17},"4-E":{"avg":11.29,"max":26,"attempted":14,"total":14},"4-M":{"avg":14.71,"max":31,"attempted":14,"total":14},"5-E":{"avg":11.62,"max":25,"attempted":8,"total":8},"5-M":{"avg":19.88,"max":34,"attempted":8,"total":8}}},{"schoolId":37,"cells":{"2-E":{"avg":5.0,"max":12,"attempted":5,"total":5},"2-M":{"avg":6.2,"max":22,"attempted":5,"total":5},"3-E":{"avg":4.43,"max":18,"attempted":7,"total":7},"3-M":{"avg":9.43,"max":34,"attempted":7,"total":7},"4-E":{"avg":4.67,"max":26,"attempted":3,"total":3},"4-M":{"avg":2.5,"max":31,"attempted":3,"total":3},"5-E":{"avg":9.08,"max":25,"attempted":6,"total":6},"5-M":{"avg":10.5,"max":34,"attempted":6,"total":6}}},{"schoolId":38,"cells":{"2-E":{"avg":10.25,"max":12,"attempted":6,"total":6},"2-M":{"avg":13.0,"max":22,"attempted":6,"total":6},"3-E":{"avg":8.0,"max":18,"attempted":2,"total":2},"3-M":{"avg":22.25,"max":34,"attempted":2,"total":2},"4-E":{"avg":15.6,"max":26,"attempted":5,"total":5},"4-M":{"avg":20.6,"max":31,"attempted":5,"total":5},"5-E":{"avg":15.67,"max":25,"attempted":3,"total":3},"5-M":{"avg":30.33,"max":34,"attempted":3,"total":3}}},{"schoolId":44,"cells":{"2-E":{"avg":2.88,"max":12,"attempted":12,"total":12},"2-M":{"avg":7.5,"max":22,"attempted":12,"total":12},"3-E":{"avg":2.15,"max":18,"attempted":13,"total":13},"3-M":{"avg":7.46,"max":34,"attempted":13,"total":13},"4-E":{"avg":3.5,"max":26,"attempted":16,"total":16},"4-M":{"avg":4.0,"max":31,"attempted":17,"total":17},"5-E":{"avg":2.85,"max":25,"attempted":13,"total":13},"5-M":{"avg":4.92,"max":34,"attempted":13,"total":13}}},{"schoolId":45,"cells":{"2-E":{"avg":5.77,"max":12,"attempted":15,"total":15},"2-M":{"avg":5.47,"max":22,"attempted":15,"total":15},"3-E":{"avg":6.25,"max":18,"attempted":16,"total":16},"3-M":{"avg":18.19,"max":34,"attempted":16,"total":16},"4-E":{"avg":6.36,"max":26,"attempted":25,"total":25},"4-M":{"avg":10.16,"max":31,"attempted":25,"total":25},"5-E":{"avg":6.0,"max":25,"attempted":6,"total":6},"5-M":{"avg":11.67,"max":34,"attempted":6,"total":6}}},{"schoolId":49,"cells":{"2-E":{"avg":4.77,"max":12,"attempted":13,"total":13},"2-M":{"avg":3.92,"max":22,"attempted":13,"total":13},"3-E":{"avg":5.17,"max":18,"attempted":6,"total":6},"3-M":{"avg":6.75,"max":34,"attempted":6,"total":6},"4-E":{"avg":14.7,"max":26,"attempted":10,"total":10},"4-M":{"avg":10.25,"max":31,"attempted":10,"total":10},"5-E":{"avg":8.77,"max":25,"attempted":11,"total":11},"5-M":{"avg":13.27,"max":34,"attempted":11,"total":11}}},{"schoolId":50,"cells":{"4-E":{"avg":14.0,"max":26,"attempted":1,"total":1},"4-M":{"avg":19.0,"max":31,"attempted":1,"total":1},"5-E":{"avg":6.33,"max":25,"attempted":3,"total":3},"5-M":{"avg":10.67,"max":34,"attempted":3,"total":3}}},{"schoolId":51,"cells":{"2-E":{"avg":11.6,"max":12,"attempted":5,"total":5},"2-M":{"avg":18.8,"max":22,"attempted":5,"total":5},"3-E":{"avg":8.33,"max":18,"attempted":9,"total":9},"3-M":{"avg":20.67,"max":34,"attempted":9,"total":9},"4-E":{"avg":9.0,"max":26,"attempted":2,"total":2},"4-M":{"avg":14.5,"max":31,"attempted":2,"total":2},"5-E":{"avg":13.6,"max":25,"attempted":5,"total":5},"5-M":{"avg":28.6,"max":34,"attempted":5,"total":5}}},{"schoolId":53,"cells":{"2-E":{"avg":3.5,"max":12,"attempted":4,"total":4},"2-M":{"avg":8.25,"max":22,"attempted":4,"total":4},"3-E":{"avg":4.0,"max":18,"attempted":7,"total":7},"3-M":{"avg":12.36,"max":34,"attempted":7,"total":7}}},{"schoolId":54,"cells":{"3-E":{"avg":4.79,"max":18,"attempted":19,"total":19},"3-M":{"avg":9.32,"max":34,"attempted":19,"total":19},"4-E":{"avg":8.74,"max":26,"attempted":19,"total":19},"4-M":{"avg":10.37,"max":31,"attempted":19,"total":19},"5-E":{"avg":5.19,"max":25,"attempted":16,"total":16},"5-M":{"avg":11.06,"max":34,"attempted":16,"total":16}}},{"schoolId":63,"cells":{"2-E":{"avg":4.0,"max":12,"attempted":6,"total":6},"2-M":{"avg":5.33,"max":22,"attempted":6,"total":6},"3-E":{"avg":2.38,"max":18,"attempted":8,"total":8},"3-M":{"avg":4.12,"max":34,"attempted":8,"total":8},"4-E":{"avg":7.38,"max":26,"attempted":13,"total":13},"4-M":{"avg":7.58,"max":31,"attempted":13,"total":13},"5-E":{"avg":8.56,"max":25,"attempted":8,"total":8},"5-M":{"avg":10.5,"max":34,"attempted":8,"total":8}}},{"schoolId":66,"cells":{"2-E":{"avg":10.8,"max":12,"attempted":10,"total":10},"2-M":{"avg":16.9,"max":22,"attempted":10,"total":10},"3-E":{"avg":15.0,"max":18,"attempted":9,"total":9},"3-M":{"avg":22.28,"max":34,"attempted":9,"total":9},"4-E":{"avg":12.6,"max":26,"attempted":5,"total":5},"4-M":{"avg":20.6,"max":31,"attempted":5,"total":5},"5-E":{"avg":11.66,"max":25,"attempted":16,"total":16},"5-M":{"avg":16.94,"max":34,"attempted":16,"total":16}}},{"schoolId":67,"cells":{"2-E":{"avg":10.8,"max":12,"attempted":5,"total":5},"2-M":{"avg":14.0,"max":22,"attempted":5,"total":5},"3-E":{"avg":10.08,"max":18,"attempted":13,"total":13},"3-M":{"avg":18.69,"max":34,"attempted":13,"total":13},"4-E":{"avg":14.83,"max":26,"attempted":6,"total":6},"4-M":{"avg":17.33,"max":31,"attempted":6,"total":6},"5-E":{"avg":17.07,"max":25,"attempted":7,"total":7},"5-M":{"avg":25.14,"max":34,"attempted":7,"total":7}}},{"schoolId":69,"cells":{"2-E":{"avg":5.26,"max":12,"attempted":17,"total":17},"2-M":{"avg":9.71,"max":22,"attempted":17,"total":17},"3-E":{"avg":5.32,"max":18,"attempted":22,"total":22},"3-M":{"avg":14.86,"max":34,"attempted":22,"total":22},"4-E":{"avg":6.3,"max":26,"attempted":23,"total":23},"4-M":{"avg":8.22,"max":31,"attempted":23,"total":23},"5-E":{"avg":2.67,"max":25,"attempted":6,"total":6},"5-M":{"avg":7.17,"max":34,"attempted":6,"total":6}}}]},"oralStatus":{"English":[{"class":1,"Pre Letter":50.17,"Capital Letter":15.82,"Small Letter":30.3,"Read Words":1.35,"Understand Words":2.36,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":13.01,"Capital Letter":7.06,"Small Letter":50.56,"Read Words":8.18,"Understand Words":10.04,"Read Sentence":2.23,"Understand Sentence":0.37,"Direct Test":0.0},{"class":3,"Pre Letter":4.75,"Capital Letter":3.26,"Small Letter":38.58,"Read Words":17.21,"Understand Words":13.65,"Read Sentence":10.98,"Understand Sentence":3.86,"Direct Test":0.0},{"class":4,"Pre Letter":4.5,"Capital Letter":3.9,"Small Letter":27.63,"Read Words":11.41,"Understand Words":18.92,"Read Sentence":18.62,"Understand Sentence":9.91,"Direct Test":0.0},{"class":5,"Pre Letter":2.63,"Capital Letter":1.75,"Small Letter":23.98,"Read Words":11.4,"Understand Words":11.99,"Read Sentence":21.35,"Understand Sentence":19.01,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":30.64,"One Digit Numbers":58.59,"Two Digit Numbers":7.74,"Addition":3.03,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":4.81,"One Digit Numbers":26.3,"Two Digit Numbers":16.67,"Addition":35.19,"Subtraction":8.15,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":0.89,"One Digit Numbers":10.98,"Two Digit Numbers":10.39,"Addition":37.09,"Subtraction":30.56,"Multiplication":1.48,"Division":0.89},{"class":4,"Pre Numbers":0.3,"One Digit Numbers":3.9,"Two Digit Numbers":5.11,"Addition":32.43,"Subtraction":30.33,"Multiplication":12.31,"Division":10.51},{"class":5,"Pre Numbers":0.87,"One Digit Numbers":2.03,"Two Digit Numbers":3.49,"Addition":25.58,"Subtraction":18.6,"Multiplication":12.21,"Division":28.78}],"Tamil":[{"class":1,"Letter":54.88,"Word":8.75,"Sentence":0.34,"Paragraph":0.0},{"class":2,"Letter":30.89,"Word":43.5,"Sentence":15.04,"Paragraph":0.81},{"class":3,"Letter":15.11,"Word":39.55,"Sentence":35.05,"Paragraph":7.72},{"class":4,"Letter":7.59,"Word":20.57,"Sentence":39.56,"Paragraph":29.43},{"class":5,"Letter":5.71,"Word":14.92,"Sentence":32.7,"Paragraph":44.44}]},"overallScores":{"English":[{"class":1,"writtenScorePct":null,"oralProgressPct":12.8},{"class":2,"writtenScorePct":63.0,"oralProgressPct":29.1},{"class":3,"writtenScorePct":38.1,"oralProgressPct":41.0},{"class":4,"writtenScorePct":41.8,"oralProgressPct":48.4},{"class":5,"writtenScorePct":37.7,"oralProgressPct":54.7}],"Maths":[{"class":1,"writtenScorePct":null,"oralProgressPct":13.9},{"class":2,"writtenScorePct":45.4,"oralProgressPct":36.2},{"class":3,"writtenScorePct":39.0,"oralProgressPct":50.2},{"class":4,"writtenScorePct":39.8,"oralProgressPct":62.8},{"class":5,"writtenScorePct":42.7,"oralProgressPct":71.7}],"Tamil":[{"class":1,"writtenScorePct":null,"oralProgressPct":4.9},{"class":2,"writtenScorePct":null,"oralProgressPct":28.1},{"class":3,"writtenScorePct":null,"oralProgressPct":45.4},{"class":4,"writtenScorePct":null,"oralProgressPct":64.5},{"class":5,"writtenScorePct":null,"oralProgressPct":72.8}]},"oralProgression":{"English":[{"class":1,"Pre Letter":100.0,"Capital Letter":49.8,"Small Letter":34.0,"Read Words":3.7,"Understand Words":2.4,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":91.4,"Capital Letter":78.4,"Small Letter":71.4,"Read Words":20.8,"Understand Words":12.6,"Read Sentence":2.6,"Understand Sentence":0.4,"Direct Test":0.0},{"class":3,"Pre Letter":92.3,"Capital Letter":87.5,"Small Letter":84.3,"Read Words":45.7,"Understand Words":28.5,"Read Sentence":14.8,"Understand Sentence":3.9,"Direct Test":0.0},{"class":4,"Pre Letter":94.9,"Capital Letter":90.4,"Small Letter":86.5,"Read Words":58.9,"Understand Words":47.4,"Read Sentence":28.5,"Understand Sentence":9.9,"Direct Test":0.0},{"class":5,"Pre Letter":92.1,"Capital Letter":89.5,"Small Letter":87.7,"Read Words":63.7,"Understand Words":52.3,"Read Sentence":40.4,"Understand Sentence":19.0,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":100.0,"One Digit Numbers":69.4,"Two Digit Numbers":10.8,"Addition":3.0,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":91.1,"One Digit Numbers":86.3,"Two Digit Numbers":60.0,"Addition":43.3,"Subtraction":8.1,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":92.3,"One Digit Numbers":91.4,"Two Digit Numbers":80.4,"Addition":70.0,"Subtraction":32.9,"Multiplication":2.4,"Division":0.9},{"class":4,"Pre Numbers":94.9,"One Digit Numbers":94.6,"Two Digit Numbers":90.7,"Addition":85.6,"Subtraction":53.2,"Multiplication":22.8,"Division":10.5},{"class":5,"Pre Numbers":91.6,"One Digit Numbers":90.7,"Two Digit Numbers":88.7,"Addition":85.2,"Subtraction":59.6,"Multiplication":41.0,"Division":28.8}],"Tamil":[{"class":1,"Letter":64.0,"Word":9.1,"Sentence":0.3,"Paragraph":0.0},{"class":2,"Letter":90.2,"Word":59.3,"Sentence":15.9,"Paragraph":0.8},{"class":3,"Letter":97.4,"Word":82.3,"Sentence":42.8,"Paragraph":7.7},{"class":4,"Letter":97.2,"Word":89.6,"Sentence":69.0,"Paragraph":29.4},{"class":5,"Letter":97.8,"Word":92.1,"Sentence":77.1,"Paragraph":44.4}]},"writtenQuestionwise":{"2":{"English":[{"q":"1.i","avgPct":88.9},{"q":"1.ii","avgPct":88.9},{"q":"1.iii","avgPct":88.9},{"q":"2.i","avgPct":55.6},{"q":"2.ii","avgPct":44.4},{"q":"2.iii","avgPct":44.4},{"q":"3.i","avgPct":44.4},{"q":"3.ii","avgPct":44.4},{"q":"3.iii","avgPct":11.1},{"q":"3.iv","avgPct":44.4},{"q":"3.v","avgPct":11.1},{"q":"3.vi","avgPct":44.4},{"q":"4.i","avgPct":88.9},{"q":"4.ii","avgPct":88.9},{"q":"4.iii","avgPct":88.9}],"Maths":[{"q":"1","avgPct":77.8},{"q":"2","avgPct":11.1},{"q":"3.i","avgPct":44.4},{"q":"3.ii","avgPct":44.4},{"q":"3.iii","avgPct":22.2},{"q":"4","avgPct":100.0},{"q":"5","avgPct":77.8},{"q":"6.i","avgPct":55.6},{"q":"6.ii","avgPct":0.0},{"q":"7.i","avgPct":22.2},{"q":"7.ii","avgPct":11.1},{"q":"7.iii","avgPct":0.0},{"q":"8.i","avgPct":33.3},{"q":"8.ii","avgPct":22.2},{"q":"8.iii","avgPct":11.1},{"q":"9.i","avgPct":55.6},{"q":"9.ii","avgPct":55.6}]},"3":{"English":[{"q":"1.i","avgPct":23.8},{"q":"1.ii","avgPct":28.6},{"q":"1.iii","avgPct":0.0},{"q":"2.i","avgPct":0.0},{"q":"2.ii","avgPct":19.0},{"q":"2.iii","avgPct":9.5},{"q":"4.i","avgPct":14.3},{"q":"4.ii","avgPct":23.8},{"q":"4.iii","avgPct":0.0},{"q":"5.i","avgPct":61.9},{"q":"5.ii","avgPct":47.6},{"q":"5.iii","avgPct":76.2},{"q":"6.i","avgPct":23.8},{"q":"6.ii","avgPct":19.0},{"q":"6.iii","avgPct":33.3},{"q":"3i","avgPct":0.0},{"q":"3ii","avgPct":9.5},{"q":"3iii","avgPct":33.3}],"Maths":[{"q":"1.i","avgPct":90.5},{"q":"1.ii","avgPct":57.1},{"q":"1.iii","avgPct":42.9},{"q":"1.iv","avgPct":9.5},{"q":"2.i","avgPct":28.6},{"q":"2.ii","avgPct":66.7},{"q":"3","avgPct":47.6},{"q":"4.i","avgPct":14.3},{"q":"4.ii","avgPct":9.5},{"q":"5.i","avgPct":61.9},{"q":"5.ii","avgPct":61.9},{"q":"5.iii","avgPct":57.1},{"q":"6.i","avgPct":69.0},{"q":"6.ii","avgPct":19.0},{"q":"7.i","avgPct":33.3},{"q":"7.ii","avgPct":9.5},{"q":"7.iii","avgPct":23.8},{"q":"7.iv","avgPct":0.0},{"q":"7.v","avgPct":4.8},{"q":"7.vi","avgPct":9.5},{"q":"7.vii","avgPct":4.8},{"q":"7.viii","avgPct":0.0},{"q":"8.i","avgPct":47.6},{"q":"8.ii","avgPct":4.8},{"q":"9.i","avgPct":28.6},{"q":"9.ii","avgPct":28.6},{"q":"10","avgPct":28.6},{"q":"11","avgPct":42.9},{"q":"12","avgPct":23.8},{"q":"13","avgPct":2.4}]},"4":{"English":[{"q":"1.i","avgPct":23.5},{"q":"1.ii","avgPct":61.8},{"q":"1.iii","avgPct":50.0},{"q":"1 iv","avgPct":44.1},{"q":"2.i","avgPct":38.2},{"q":"2.ii","avgPct":35.3},{"q":"2.iii","avgPct":0.0},{"q":"2.iv","avgPct":41.2},{"q":"3 i","avgPct":67.6},{"q":"3ii","avgPct":67.6},{"q":"3iii","avgPct":55.9},{"q":"3iv","avgPct":70.6},{"q":"4i","avgPct":20.6},{"q":"4ii","avgPct":41.2},{"q":"4iii","avgPct":35.3},{"q":"4iv","avgPct":47.1},{"q":"5i","avgPct":47.1},{"q":"5ii","avgPct":47.1},{"q":"5iii","avgPct":52.9},{"q":"5iv","avgPct":58.8},{"q":"6i","avgPct":0.0},{"q":"6ii","avgPct":17.6},{"q":"6iii","avgPct":17.6},{"q":"6iv","avgPct":7.4}],"Maths":[{"q":"1.i","avgPct":97.1},{"q":"1.ii","avgPct":91.2},{"q":"1.iii","avgPct":88.2},{"q":"2.i","avgPct":79.4},{"q":"2.ii","avgPct":23.5},{"q":"3","avgPct":27.9},{"q":"4","avgPct":23.5},{"q":"5","avgPct":44.1},{"q":"6","avgPct":26.5},{"q":"7","avgPct":57.4},{"q":"8","avgPct":33.8},{"q":"9.i","avgPct":8.8},{"q":"9.ii","avgPct":8.8},{"q":"9.iii","avgPct":11.8},{"q":"9.iv","avgPct":44.1},{"q":"9.v","avgPct":5.9},{"q":"9.vi","avgPct":29.4},{"q":"9.vii","avgPct":14.7},{"q":"9.viii","avgPct":5.9},{"q":"10","avgPct":50.0},{"q":"11","avgPct":11.8},{"q":"12","avgPct":16.2},{"q":"13","avgPct":8.8},{"q":"14","avgPct":85.3},{"q":"15","avgPct":0.0}]},"5":{"English":[{"q":"1.i","avgPct":60.0},{"q":"1.ii","avgPct":20.0},{"q":"1.iii","avgPct":40.0},{"q":"2.i","avgPct":22.5},{"q":"2.ii","avgPct":40.0},{"q":"2.iii","avgPct":55.0},{"q":"2.iv","avgPct":55.0},{"q":"3.i","avgPct":0.0},{"q":"3.ii","avgPct":47.5},{"q":"3.iii","avgPct":55.0},{"q":"3.iv","avgPct":0.0},{"q":"4.i","avgPct":33.8},{"q":"4.ii","avgPct":50.0},{"q":"4.iii","avgPct":47.5},{"q":"4.iv","avgPct":30.0},{"q":"5.i","avgPct":70.0},{"q":"5.ii","avgPct":57.5},{"q":"5.iii","avgPct":52.5},{"q":"5.iv","avgPct":62.5},{"q":"6.i","avgPct":27.5},{"q":"6.ii","avgPct":50.0},{"q":"6.iii","avgPct":57.5},{"q":"6.iv","avgPct":32.5},{"q":"6.v","avgPct":8.8}],"Maths":[{"q":"1","avgPct":36.2},{"q":"2","avgPct":75.0},{"q":"3","avgPct":50.0},{"q":"4","avgPct":60.0},{"q":"5.i","avgPct":80.0},{"q":"5.ii","avgPct":77.5},{"q":"6","avgPct":51.2},{"q":"7","avgPct":31.2},{"q":"8","avgPct":35.0},{"q":"9","avgPct":47.5},{"q":"10.i","avgPct":62.5},{"q":"10.ii","avgPct":42.5},{"q":"10.iii","avgPct":42.5},{"q":"10.iv","avgPct":22.5},{"q":"10.v","avgPct":27.5},{"q":"10.vi","avgPct":35.0},{"q":"11","avgPct":31.2},{"q":"12","avgPct":63.8},{"q":"13","avgPct":57.5},{"q":"14.i","avgPct":30.0},{"q":"14.ii","avgPct":15.0},{"q":"14.iii","avgPct":25.0},{"q":"15","avgPct":33.8},{"q":"16","avgPct":38.8}]}}},"2019":{"schoolAverages":{"classSubjectCols":["1-E","1-M","2-E","2-M","3-E","3-M","4-E","4-M","5-E","5-M","6-E","6-M"],"schools":[{"schoolId":1,"cells":{"2-E":{"avg":6.25,"max":15,"attempted":8,"total":8},"2-M":{"avg":8.38,"max":25,"attempted":8,"total":8},"3-E":{"avg":9.55,"max":18,"attempted":11,"total":11},"3-M":{"avg":16.59,"max":33,"attempted":11,"total":11}}},{"schoolId":2,"cells":{"2-E":{"avg":11.47,"max":15,"attempted":19,"total":19},"2-M":{"avg":13.18,"max":25,"attempted":19,"total":19},"3-E":{"avg":10.04,"max":18,"attempted":24,"total":24},"3-M":{"avg":19.02,"max":33,"attempted":24,"total":24}}},{"schoolId":3,"cells":{"4-E":{"avg":4.08,"max":23,"attempted":12,"total":12},"4-M":{"avg":6.33,"max":29,"attempted":12,"total":12},"5-E":{"avg":9.0,"max":26,"attempted":11,"total":11},"5-M":{"avg":15.23,"max":30,"attempted":11,"total":11}}},{"schoolId":4,"cells":{"2-E":{"avg":7.33,"max":15,"attempted":3,"total":3},"2-M":{"avg":2.83,"max":25,"attempted":3,"total":3},"3-E":{"avg":11.1,"max":18,"attempted":10,"total":10},"3-M":{"avg":17.3,"max":33,"attempted":10,"total":10},"4-E":{"avg":14.8,"max":23,"attempted":5,"total":5},"4-M":{"avg":14.2,"max":29,"attempted":5,"total":5},"5-E":{"avg":10.6,"max":26,"attempted":5,"total":5},"5-M":{"avg":17.2,"max":30,"attempted":5,"total":5}}},{"schoolId":5,"cells":{"2-E":{"avg":8.08,"max":15,"attempted":13,"total":13},"2-M":{"avg":8.38,"max":25,"attempted":13,"total":13},"3-E":{"avg":11.45,"max":18,"attempted":11,"total":11},"3-M":{"avg":18.82,"max":33,"attempted":11,"total":11},"4-E":{"avg":9.84,"max":23,"attempted":19,"total":19},"4-M":{"avg":8.89,"max":29,"attempted":19,"total":19},"5-E":{"avg":8.9,"max":26,"attempted":26,"total":26},"5-M":{"avg":11.88,"max":30,"attempted":26,"total":26}}},{"schoolId":6,"cells":{"2-E":{"avg":13.2,"max":15,"attempted":5,"total":5},"2-M":{"avg":21.1,"max":25,"attempted":5,"total":5},"5-E":{"avg":16.4,"max":26,"attempted":5,"total":5},"5-M":{"avg":24.2,"max":30,"attempted":5,"total":5}}},{"schoolId":7,"cells":{"2-E":{"avg":9.86,"max":15,"attempted":21,"total":21},"2-M":{"avg":11.62,"max":25,"attempted":21,"total":21},"5-E":{"avg":5.88,"max":26,"attempted":13,"total":13},"5-M":{"avg":8.23,"max":30,"attempted":13,"total":13}}},{"schoolId":8,"cells":{"2-E":{"avg":8.0,"max":15,"attempted":7,"total":7},"2-M":{"avg":10.14,"max":25,"attempted":7,"total":7},"5-E":{"avg":9.12,"max":26,"attempted":8,"total":8},"5-M":{"avg":15.06,"max":30,"attempted":8,"total":8}}},{"schoolId":9,"cells":{"4-E":{"avg":3.7,"max":23,"attempted":10,"total":10},"4-M":{"avg":3.6,"max":29,"attempted":10,"total":10},"5-E":{"avg":5.47,"max":26,"attempted":17,"total":17},"5-M":{"avg":8.15,"max":30,"attempted":17,"total":17}}},{"schoolId":10,"cells":{"2-E":{"avg":7.77,"max":15,"attempted":13,"total":13},"2-M":{"avg":10.69,"max":25,"attempted":13,"total":13},"3-E":{"avg":6.0,"max":18,"attempted":8,"total":8},"3-M":{"avg":11.31,"max":33,"attempted":8,"total":8},"4-E":{"avg":7.58,"max":23,"attempted":12,"total":12},"4-M":{"avg":7.42,"max":29,"attempted":12,"total":12},"5-E":{"avg":4.69,"max":26,"attempted":13,"total":13},"5-M":{"avg":11.65,"max":30,"attempted":13,"total":13}}},{"schoolId":11,"cells":{"2-E":{"avg":8.19,"max":15,"attempted":16,"total":16},"2-M":{"avg":8.31,"max":25,"attempted":16,"total":16},"3-E":{"avg":6.47,"max":18,"attempted":17,"total":17},"3-M":{"avg":13.56,"max":33,"attempted":17,"total":17},"4-E":{"avg":8.88,"max":23,"attempted":16,"total":16},"4-M":{"avg":8.19,"max":29,"attempted":16,"total":16}}},{"schoolId":12,"cells":{"2-E":{"avg":5.68,"max":15,"attempted":41,"total":41},"2-M":{"avg":7.1,"max":25,"attempted":40,"total":40},"3-E":{"avg":4.19,"max":18,"attempted":36,"total":36},"3-M":{"avg":5.6,"max":33,"attempted":36,"total":36},"4-E":{"avg":5.29,"max":23,"attempted":38,"total":38},"4-M":{"avg":5.62,"max":29,"attempted":37,"total":37},"5-E":{"avg":6.88,"max":26,"attempted":52,"total":52},"5-M":{"avg":8.9,"max":30,"attempted":52,"total":52}}},{"schoolId":13,"cells":{"2-E":{"avg":4.79,"max":15,"attempted":14,"total":14},"2-M":{"avg":8.07,"max":25,"attempted":14,"total":14},"3-E":{"avg":3.5,"max":18,"attempted":20,"total":20},"3-M":{"avg":14.32,"max":33,"attempted":20,"total":20},"4-E":{"avg":3.12,"max":23,"attempted":16,"total":16},"4-M":{"avg":4.35,"max":29,"attempted":17,"total":17},"5-E":{"avg":8.71,"max":26,"attempted":14,"total":14},"5-M":{"avg":16.61,"max":30,"attempted":14,"total":14}}},{"schoolId":14,"cells":{"2-E":{"avg":5.7,"max":15,"attempted":10,"total":10},"2-M":{"avg":6.3,"max":25,"attempted":10,"total":10},"3-E":{"avg":9.8,"max":18,"attempted":10,"total":10},"3-M":{"avg":18.0,"max":33,"attempted":10,"total":10}}},{"schoolId":18,"cells":{"2-E":{"avg":9.0,"max":15,"attempted":6,"total":6},"2-M":{"avg":12.33,"max":25,"attempted":6,"total":6},"3-E":{"avg":7.0,"max":18,"attempted":6,"total":6},"3-M":{"avg":10.25,"max":33,"attempted":6,"total":6},"4-E":{"avg":6.33,"max":23,"attempted":3,"total":3},"4-M":{"avg":7.0,"max":29,"attempted":3,"total":3},"5-E":{"avg":5.44,"max":26,"attempted":8,"total":8},"5-M":{"avg":11.19,"max":30,"attempted":8,"total":8}}},{"schoolId":20,"cells":{"2-E":{"avg":10.43,"max":15,"attempted":7,"total":7},"2-M":{"avg":8.64,"max":25,"attempted":7,"total":7},"3-E":{"avg":4.22,"max":18,"attempted":9,"total":9},"3-M":{"avg":12.28,"max":33,"attempted":9,"total":9}}},{"schoolId":22,"cells":{"2-E":{"avg":4.0,"max":15,"attempted":5,"total":5},"2-M":{"avg":7.2,"max":25,"attempted":5,"total":5},"3-E":{"avg":8.33,"max":18,"attempted":3,"total":3},"3-M":{"avg":17.33,"max":33,"attempted":3,"total":3},"4-E":{"avg":6.4,"max":23,"attempted":5,"total":5},"4-M":{"avg":6.0,"max":29,"attempted":5,"total":5},"5-E":{"avg":11.86,"max":26,"attempted":7,"total":7},"5-M":{"avg":15.43,"max":30,"attempted":7,"total":7}}},{"schoolId":23,"cells":{"2-E":{"avg":12.33,"max":15,"attempted":9,"total":9},"2-M":{"avg":20.67,"max":25,"attempted":9,"total":9},"3-E":{"avg":15.86,"max":18,"attempted":7,"total":7},"3-M":{"avg":28.36,"max":33,"attempted":7,"total":7},"4-E":{"avg":10.27,"max":23,"attempted":11,"total":11},"4-M":{"avg":10.64,"max":29,"attempted":11,"total":11},"5-E":{"avg":9.42,"max":26,"attempted":6,"total":6},"5-M":{"avg":13.17,"max":30,"attempted":6,"total":6}}},{"schoolId":24,"cells":{"2-E":{"avg":8.25,"max":15,"attempted":4,"total":4},"2-M":{"avg":12.0,"max":25,"attempted":4,"total":4},"3-E":{"avg":4.0,"max":18,"attempted":2,"total":2},"3-M":{"avg":15.0,"max":33,"attempted":2,"total":2},"4-E":{"avg":8.0,"max":23,"attempted":1,"total":1},"4-M":{"avg":3.0,"max":29,"attempted":1,"total":1},"5-E":{"avg":9.33,"max":26,"attempted":6,"total":6},"5-M":{"avg":17.0,"max":30,"attempted":6,"total":6}}},{"schoolId":25,"cells":{"2-E":{"avg":6.67,"max":15,"attempted":3,"total":3},"2-M":{"avg":7.33,"max":25,"attempted":3,"total":3},"3-E":{"avg":12.8,"max":18,"attempted":5,"total":5},"3-M":{"avg":18.0,"max":33,"attempted":5,"total":5},"4-E":{"avg":13.0,"max":23,"attempted":1,"total":1},"4-M":{"avg":25.0,"max":29,"attempted":1,"total":1},"5-E":{"avg":10.25,"max":26,"attempted":2,"total":2},"5-M":{"avg":14.5,"max":30,"attempted":2,"total":2}}},{"schoolId":26,"cells":{"4-E":{"avg":10.17,"max":23,"attempted":18,"total":18},"4-M":{"avg":13.94,"max":29,"attempted":18,"total":18},"5-E":{"avg":11.77,"max":26,"attempted":15,"total":15},"5-M":{"avg":17.17,"max":30,"attempted":15,"total":15}}},{"schoolId":37,"cells":{"2-E":{"avg":7.67,"max":15,"attempted":3,"total":3},"2-M":{"avg":10.33,"max":25,"attempted":3,"total":3},"3-E":{"avg":8.4,"max":18,"attempted":5,"total":5},"3-M":{"avg":10.2,"max":33,"attempted":5,"total":5},"4-E":{"avg":6.57,"max":23,"attempted":7,"total":7},"4-M":{"avg":4.86,"max":29,"attempted":7,"total":7},"5-E":{"avg":6.83,"max":26,"attempted":3,"total":3},"5-M":{"avg":11.0,"max":30,"attempted":3,"total":3}}},{"schoolId":38,"cells":{"2-E":{"avg":11.25,"max":15,"attempted":4,"total":4},"2-M":{"avg":14.88,"max":25,"attempted":4,"total":4},"3-E":{"avg":14.83,"max":18,"attempted":6,"total":6},"3-M":{"avg":20.33,"max":33,"attempted":6,"total":6},"4-E":{"avg":14.5,"max":23,"attempted":2,"total":2},"4-M":{"avg":23.0,"max":29,"attempted":2,"total":2},"5-E":{"avg":16.3,"max":26,"attempted":5,"total":5},"5-M":{"avg":27.1,"max":30,"attempted":5,"total":5}}},{"schoolId":44,"cells":{"2-E":{"avg":3.88,"max":15,"attempted":17,"total":17},"2-M":{"avg":8.24,"max":25,"attempted":17,"total":17},"3-E":{"avg":1.55,"max":18,"attempted":11,"total":11},"3-M":{"avg":7.59,"max":33,"attempted":11,"total":11},"4-E":{"avg":2.15,"max":23,"attempted":13,"total":13},"4-M":{"avg":3.15,"max":29,"attempted":13,"total":13},"5-E":{"avg":1.24,"max":26,"attempted":23,"total":23},"5-M":{"avg":2.78,"max":30,"attempted":23,"total":23}}},{"schoolId":45,"cells":{"2-E":{"avg":8.41,"max":15,"attempted":17,"total":17},"2-M":{"avg":12.12,"max":25,"attempted":17,"total":17},"3-E":{"avg":8.41,"max":18,"attempted":17,"total":17},"3-M":{"avg":18.5,"max":33,"attempted":17,"total":17},"4-E":{"avg":7.71,"max":23,"attempted":17,"total":17},"4-M":{"avg":6.71,"max":29,"attempted":17,"total":17},"5-E":{"avg":5.1,"max":26,"attempted":10,"total":10},"5-M":{"avg":6.15,"max":30,"attempted":10,"total":10}}},{"schoolId":49,"cells":{"2-E":{"avg":8.9,"max":15,"attempted":10,"total":10},"2-M":{"avg":10.3,"max":25,"attempted":10,"total":10},"4-E":{"avg":4.67,"max":23,"attempted":3,"total":3},"4-M":{"avg":0.0,"max":29,"attempted":3,"total":3},"5-E":{"avg":8.15,"max":26,"attempted":10,"total":10},"5-M":{"avg":12.2,"max":30,"attempted":10,"total":10}}},{"schoolId":51,"cells":{"2-E":{"avg":12.0,"max":15,"attempted":6,"total":6},"2-M":{"avg":18.08,"max":25,"attempted":6,"total":6},"3-E":{"avg":13.38,"max":18,"attempted":8,"total":8},"3-M":{"avg":23.12,"max":33,"attempted":8,"total":8},"4-E":{"avg":10.67,"max":23,"attempted":9,"total":9},"4-M":{"avg":9.67,"max":29,"attempted":9,"total":9},"5-E":{"avg":7.0,"max":26,"attempted":2,"total":2},"5-M":{"avg":21.75,"max":30,"attempted":2,"total":2}}},{"schoolId":53,"cells":{"2-E":{"avg":8.6,"max":15,"attempted":5,"total":5},"2-M":{"avg":12.5,"max":25,"attempted":5,"total":5},"3-E":{"avg":11.33,"max":18,"attempted":3,"total":3},"3-M":{"avg":16.0,"max":33,"attempted":3,"total":3}}},{"schoolId":54,"cells":{"4-E":{"avg":7.94,"max":23,"attempted":18,"total":18},"4-M":{"avg":7.44,"max":29,"attempted":18,"total":18},"5-E":{"avg":7.55,"max":26,"attempted":19,"total":19},"5-M":{"avg":11.37,"max":30,"attempted":19,"total":19}}},{"schoolId":63,"cells":{"2-E":{"avg":4.83,"max":15,"attempted":6,"total":6},"2-M":{"avg":8.08,"max":25,"attempted":6,"total":6},"3-E":{"avg":4.43,"max":18,"attempted":7,"total":7},"3-M":{"avg":11.64,"max":33,"attempted":7,"total":7},"4-E":{"avg":4.14,"max":23,"attempted":7,"total":7},"4-M":{"avg":4.86,"max":29,"attempted":7,"total":7},"5-E":{"avg":6.12,"max":26,"attempted":12,"total":12},"5-M":{"avg":9.38,"max":30,"attempted":12,"total":12}}},{"schoolId":66,"cells":{"2-E":{"avg":11.6,"max":15,"attempted":5,"total":5},"2-M":{"avg":16.1,"max":25,"attempted":5,"total":5},"3-E":{"avg":13.89,"max":18,"attempted":9,"total":9},"3-M":{"avg":22.33,"max":33,"attempted":9,"total":9},"4-E":{"avg":16.44,"max":23,"attempted":9,"total":9},"4-M":{"avg":16.89,"max":29,"attempted":9,"total":9},"5-E":{"avg":12.5,"max":26,"attempted":5,"total":5},"5-M":{"avg":21.3,"max":30,"attempted":5,"total":5}}},{"schoolId":67,"cells":{"2-E":{"avg":11.6,"max":15,"attempted":5,"total":5},"2-M":{"avg":15.7,"max":25,"attempted":5,"total":5},"3-E":{"avg":15.75,"max":18,"attempted":4,"total":4},"3-M":{"avg":24.38,"max":33,"attempted":4,"total":4},"4-E":{"avg":15.23,"max":23,"attempted":13,"total":13},"4-M":{"avg":16.62,"max":29,"attempted":13,"total":13},"5-E":{"avg":11.75,"max":26,"attempted":6,"total":6},"5-M":{"avg":20.33,"max":30,"attempted":6,"total":6}}},{"schoolId":69,"cells":{"2-E":{"avg":7.32,"max":15,"attempted":25,"total":25},"2-M":{"avg":8.06,"max":25,"attempted":25,"total":25},"3-E":{"avg":11.65,"max":18,"attempted":23,"total":23},"3-M":{"avg":21.26,"max":33,"attempted":23,"total":23},"4-E":{"avg":6.62,"max":23,"attempted":26,"total":26},"4-M":{"avg":9.46,"max":29,"attempted":26,"total":26},"5-E":{"avg":5.76,"max":26,"attempted":17,"total":17},"5-M":{"avg":12.97,"max":30,"attempted":17,"total":17}}}]},"oralStatus":{"English":[{"class":1,"Pre Letter":42.96,"Capital Letter":17.33,"Small Letter":37.55,"Read Words":0.72,"Understand Words":1.44,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":12.05,"Capital Letter":6.51,"Small Letter":46.58,"Read Words":8.79,"Understand Words":11.4,"Read Sentence":3.26,"Understand Sentence":0.0,"Direct Test":0.0},{"class":3,"Pre Letter":4.41,"Capital Letter":3.68,"Small Letter":36.4,"Read Words":10.66,"Understand Words":19.85,"Read Sentence":12.5,"Understand Sentence":4.04,"Direct Test":0.0},{"class":4,"Pre Letter":5.15,"Capital Letter":2.41,"Small Letter":29.55,"Read Words":13.4,"Understand Words":14.43,"Read Sentence":14.43,"Understand Sentence":12.03,"Direct Test":0.0},{"class":5,"Pre Letter":4.06,"Capital Letter":1.88,"Small Letter":20.94,"Read Words":11.25,"Understand Words":14.69,"Read Sentence":17.19,"Understand Sentence":22.5,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":31.05,"One Digit Numbers":58.12,"Two Digit Numbers":10.11,"Addition":0.36,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":3.27,"One Digit Numbers":25.16,"Two Digit Numbers":19.28,"Addition":34.31,"Subtraction":6.86,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":0.37,"One Digit Numbers":9.56,"Two Digit Numbers":6.25,"Addition":38.6,"Subtraction":33.46,"Multiplication":3.31,"Division":0.0},{"class":4,"Pre Numbers":0.34,"One Digit Numbers":8.93,"Two Digit Numbers":4.12,"Addition":28.18,"Subtraction":32.3,"Multiplication":7.56,"Division":9.97},{"class":5,"Pre Numbers":0.62,"One Digit Numbers":3.44,"Two Digit Numbers":2.81,"Addition":21.25,"Subtraction":21.25,"Multiplication":11.56,"Division":31.56}],"Tamil":[{"class":1,"Letter":53.07,"Word":6.5,"Sentence":0.0,"Paragraph":0.0},{"class":2,"Letter":33.46,"Word":41.18,"Sentence":15.07,"Paragraph":1.1},{"class":3,"Letter":18.47,"Word":36.14,"Sentence":34.14,"Paragraph":8.43},{"class":4,"Letter":11.28,"Word":23.68,"Sentence":43.61,"Paragraph":18.05},{"class":5,"Letter":5.41,"Word":16.55,"Sentence":36.49,"Paragraph":37.84}]},"overallScores":{"English":[{"class":1,"writtenScorePct":null,"oralProgressPct":14.3},{"class":2,"writtenScorePct":57.9,"oralProgressPct":30.3},{"class":3,"writtenScorePct":51.4,"oralProgressPct":42.9},{"class":4,"writtenScorePct":36.2,"oralProgressPct":47.5},{"class":5,"writtenScorePct":32.7,"oralProgressPct":55.2}],"Maths":[{"class":1,"writtenScorePct":null,"oralProgressPct":13.3},{"class":2,"writtenScorePct":45.1,"oralProgressPct":36.4},{"class":3,"writtenScorePct":52.0,"oralProgressPct":52.5},{"class":4,"writtenScorePct":31.4,"oralProgressPct":59.9},{"class":5,"writtenScorePct":44.7,"oralProgressPct":73.0}],"Tamil":[{"class":1,"writtenScorePct":null,"oralProgressPct":3.6},{"class":2,"writtenScorePct":null,"oralProgressPct":27.4},{"class":3,"writtenScorePct":null,"oralProgressPct":44.5},{"class":4,"writtenScorePct":null,"oralProgressPct":56.9},{"class":5,"writtenScorePct":null,"oralProgressPct":70.3}]},"oralProgression":{"English":[{"class":1,"Pre Letter":100.0,"Capital Letter":57.0,"Small Letter":39.7,"Read Words":2.2,"Understand Words":1.4,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":88.6,"Capital Letter":76.5,"Small Letter":70.0,"Read Words":23.5,"Understand Words":14.7,"Read Sentence":3.3,"Understand Sentence":0.0,"Direct Test":0.0},{"class":3,"Pre Letter":91.5,"Capital Letter":87.1,"Small Letter":83.5,"Read Words":47.1,"Understand Words":36.4,"Read Sentence":16.5,"Understand Sentence":4.0,"Direct Test":0.0},{"class":4,"Pre Letter":91.4,"Capital Letter":86.3,"Small Letter":83.8,"Read Words":54.3,"Understand Words":40.9,"Read Sentence":26.5,"Understand Sentence":12.0,"Direct Test":0.0},{"class":5,"Pre Letter":92.5,"Capital Letter":88.4,"Small Letter":86.6,"Read Words":65.6,"Understand Words":54.4,"Read Sentence":39.7,"Understand Sentence":22.5,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":99.6,"One Digit Numbers":68.6,"Two Digit Numbers":10.5,"Addition":0.4,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":88.9,"One Digit Numbers":85.6,"Two Digit Numbers":60.5,"Addition":41.2,"Subtraction":6.9,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":91.5,"One Digit Numbers":91.2,"Two Digit Numbers":81.6,"Addition":75.4,"Subtraction":36.8,"Multiplication":3.3,"Division":0.0},{"class":4,"Pre Numbers":91.4,"One Digit Numbers":91.1,"Two Digit Numbers":82.1,"Addition":78.0,"Subtraction":49.8,"Multiplication":17.5,"Division":10.0},{"class":5,"Pre Numbers":92.5,"One Digit Numbers":91.9,"Two Digit Numbers":88.4,"Addition":85.6,"Subtraction":64.4,"Multiplication":43.1,"Division":31.6}],"Tamil":[{"class":1,"Letter":59.6,"Word":6.5,"Sentence":0.0,"Paragraph":0.0},{"class":2,"Letter":90.8,"Word":57.4,"Sentence":16.2,"Paragraph":1.1},{"class":3,"Letter":97.2,"Word":78.7,"Sentence":42.6,"Paragraph":8.4},{"class":4,"Letter":96.6,"Word":85.3,"Sentence":61.7,"Paragraph":18.0},{"class":5,"Letter":96.3,"Word":90.9,"Sentence":74.3,"Paragraph":37.8}]},"writtenQuestionwise":{"4":{"English":[{"q":"1.i","avgPct":72.2},{"q":"1.ii","avgPct":16.7},{"q":"1.iii","avgPct":16.7},{"q":"1 iv","avgPct":38.9},{"q":"2.i","avgPct":16.7},{"q":"2.ii","avgPct":22.2},{"q":"2.iii","avgPct":16.7},{"q":"2.iv","avgPct":27.8},{"q":"3 i","avgPct":44.4},{"q":"3ii","avgPct":0.0},{"q":"3iii","avgPct":0.0},{"q":"3iv","avgPct":38.9},{"q":"4i","avgPct":5.6},{"q":"4ii","avgPct":27.8},{"q":"4iii","avgPct":16.7},{"q":"5i","avgPct":16.7},{"q":"5ii","avgPct":33.3},{"q":"5iii","avgPct":25.0},{"q":"6i","avgPct":5.6},{"q":"6ii","avgPct":11.1},{"q":"6iii","avgPct":0.0}],"Maths":[{"q":"1.i","avgPct":5.6},{"q":"1.ii","avgPct":5.6},{"q":"2.i","avgPct":72.2},{"q":"2.ii","avgPct":33.3},{"q":"3.i","avgPct":22.2},{"q":"3.ii","avgPct":11.1},{"q":"4","avgPct":61.1},{"q":"5","avgPct":19.4},{"q":"6","avgPct":16.7},{"q":"7.i","avgPct":22.2},{"q":"7.ii","avgPct":11.1},{"q":"8.i","avgPct":11.1},{"q":"8.ii","avgPct":36.1},{"q":"9","avgPct":33.3},{"q":"10","avgPct":16.7},{"q":"11","avgPct":5.6},{"q":"12.i","avgPct":11.1},{"q":"12.ii","avgPct":5.6},{"q":"12.iii","avgPct":11.1},{"q":"12.iv","avgPct":16.7},{"q":"12.v","avgPct":5.6},{"q":"13.i","avgPct":50.0},{"q":"13.ii","avgPct":27.8},{"q":"14.i","avgPct":16.7},{"q":"14.ii","avgPct":11.1}]},"5":{"Maths":[{"q":"1","avgPct":68.8},{"q":"2.i","avgPct":68.8},{"q":"2.ii","avgPct":56.2},{"q":"3","avgPct":60.9},{"q":"4","avgPct":65.6},{"q":"5","avgPct":31.2},{"q":"6","avgPct":48.4},{"q":"7","avgPct":37.5},{"q":"8.i","avgPct":28.1},{"q":"8.ii","avgPct":18.8},{"q":"8.iii","avgPct":34.4},{"q":"8.iv","avgPct":34.4},{"q":"8.v","avgPct":0.0},{"q":"9","avgPct":31.2},{"q":"10.i","avgPct":26.6},{"q":"10.ii","avgPct":65.6},{"q":"11","avgPct":68.8},{"q":"12.i","avgPct":53.1},{"q":"12.ii","avgPct":43.8},{"q":"13","avgPct":12.5},{"q":"14","avgPct":65.6},{"q":"15","avgPct":45.3}],"English":[{"q":"1.i","avgPct":14.1},{"q":"1.ii","avgPct":54.7},{"q":"1.iii","avgPct":50.0},{"q":"2.i","avgPct":50.0},{"q":"2.ii","avgPct":25.0},{"q":"2.iii","avgPct":34.4},{"q":"2.iv","avgPct":56.2},{"q":"3i","avgPct":25.0},{"q":"3ii","avgPct":46.9},{"q":"3iii","avgPct":50.0},{"q":"4i","avgPct":12.5},{"q":"4ii","avgPct":34.4},{"q":"4iii","avgPct":50.0},{"q":"4iv","avgPct":18.8},{"q":"5i","avgPct":37.5},{"q":"5ii","avgPct":43.8},{"q":"5iii","avgPct":0.0},{"q":"5iv","avgPct":0.0},{"q":"6i","avgPct":37.5},{"q":"6ii","avgPct":25.0},{"q":"6iii","avgPct":20.3},{"q":"6iv","avgPct":3.1}]},"2":{"English":[{"q":"1.i","avgPct":53.3},{"q":"1.ii","avgPct":66.7},{"q":"1.iii","avgPct":26.7},{"q":"2","avgPct":60.0},{"q":"3.i","avgPct":86.7},{"q":"3.ii","avgPct":60.0},{"q":"3.iii","avgPct":53.3},{"q":"4.i","avgPct":73.3},{"q":"4. ii","avgPct":73.3},{"q":"4.iii","avgPct":86.7},{"q":"5.i","avgPct":60.0},{"q":"5.ii","avgPct":40.0},{"q":"5.iii","avgPct":26.7},{"q":"5.iv","avgPct":46.7}],"Maths":[{"q":"1","avgPct":26.7},{"q":"2","avgPct":33.3},{"q":"3","avgPct":20.0},{"q":"4.i","avgPct":33.3},{"q":"4.ii","avgPct":33.3},{"q":"4.iii","avgPct":73.3},{"q":"5.i","avgPct":60.0},{"q":"5.ii","avgPct":60.0},{"q":"6.i","avgPct":50.0},{"q":"6.ii","avgPct":33.3},{"q":"6.iii","avgPct":13.3},{"q":"7.i","avgPct":43.3},{"q":"7.ii","avgPct":20.0},{"q":"8.i","avgPct":26.7},{"q":"8.ii","avgPct":13.3},{"q":"9.i","avgPct":33.3},{"q":"9.ii","avgPct":20.0},{"q":"9.iii","avgPct":40.0},{"q":"10","avgPct":53.3},{"q":"11.i","avgPct":46.7},{"q":"11.ii","avgPct":46.7},{"q":"12","avgPct":80.0}]}}},"2020":{"schoolAverages":{"classSubjectCols":["1-E","1-M","2-E","2-M","3-E","3-M","4-E","4-M","5-E","5-M","6-E","6-M"],"schools":[{"schoolId":1,"cells":{"2-E":{"avg":10.71,"max":15,"attempted":14,"total":14},"2-M":{"avg":16.04,"max":29,"attempted":14,"total":14},"3-E":{"avg":7.11,"max":20,"attempted":9,"total":9},"3-M":{"avg":12.11,"max":36,"attempted":9,"total":9}}},{"schoolId":2,"cells":{"2-E":{"avg":10.1,"max":15,"attempted":21,"total":21},"2-M":{"avg":12.5,"max":29,"attempted":21,"total":21},"3-E":{"avg":4.35,"max":20,"attempted":23,"total":23},"3-M":{"avg":5.3,"max":36,"attempted":23,"total":23}}},{"schoolId":3,"cells":{"2-E":{"avg":10.0,"max":15,"attempted":7,"total":7},"2-M":{"avg":14.86,"max":29,"attempted":7,"total":7},"5-E":{"avg":5.88,"max":28,"attempted":12,"total":12},"5-M":{"avg":9.21,"max":31,"attempted":12,"total":12}}},{"schoolId":4,"cells":{"2-E":{"avg":4.0,"max":15,"attempted":1,"total":1},"2-M":{"avg":7.0,"max":29,"attempted":1,"total":1},"3-E":{"avg":5.5,"max":20,"attempted":2,"total":2},"3-M":{"avg":12.25,"max":36,"attempted":2,"total":2},"4-E":{"avg":6.56,"max":22,"attempted":9,"total":9},"4-M":{"avg":12.44,"max":34,"attempted":9,"total":9},"5-E":{"avg":15.0,"max":28,"attempted":3,"total":3},"5-M":{"avg":17.17,"max":31,"attempted":3,"total":3}}},{"schoolId":5,"cells":{"2-E":{"avg":10.25,"max":15,"attempted":8,"total":8},"2-M":{"avg":13.94,"max":29,"attempted":8,"total":8},"3-E":{"avg":8.27,"max":20,"attempted":15,"total":15},"3-M":{"avg":13.8,"max":36,"attempted":15,"total":15},"4-E":{"avg":7.46,"max":22,"attempted":13,"total":13},"4-M":{"avg":10.92,"max":34,"attempted":13,"total":13},"5-E":{"avg":10.81,"max":28,"attempted":21,"total":21},"5-M":{"avg":11.26,"max":31,"attempted":21,"total":21}}},{"schoolId":6,"cells":{"2-E":{"avg":11.0,"max":15,"attempted":12,"total":12},"2-M":{"avg":17.54,"max":29,"attempted":12,"total":12}}},{"schoolId":7,"cells":{"2-E":{"avg":6.16,"max":15,"attempted":19,"total":19},"2-M":{"avg":3.68,"max":29,"attempted":19,"total":19}}},{"schoolId":8,"cells":{"2-E":{"avg":9.82,"max":15,"attempted":11,"total":11},"2-M":{"avg":9.95,"max":29,"attempted":11,"total":11}}},{"schoolId":9,"cells":{"5-E":{"avg":5.4,"max":28,"attempted":10,"total":10},"5-M":{"avg":6.7,"max":31,"attempted":10,"total":10}}},{"schoolId":10,"cells":{"2-E":{"avg":9.62,"max":15,"attempted":8,"total":8},"2-M":{"avg":14.44,"max":29,"attempted":8,"total":8},"3-E":{"avg":3.31,"max":20,"attempted":13,"total":13},"3-M":{"avg":7.58,"max":36,"attempted":13,"total":13},"4-E":{"avg":2.07,"max":22,"attempted":7,"total":7},"4-M":{"avg":4.64,"max":34,"attempted":7,"total":7},"5-E":{"avg":6.11,"max":28,"attempted":14,"total":14},"5-M":{"avg":9.96,"max":31,"attempted":14,"total":14}}},{"schoolId":11,"cells":{"2-E":{"avg":8.0,"max":15,"attempted":20,"total":20},"2-M":{"avg":6.17,"max":29,"attempted":20,"total":20},"3-E":{"avg":3.17,"max":20,"attempted":23,"total":23},"3-M":{"avg":6.26,"max":36,"attempted":23,"total":23},"4-E":{"avg":4.36,"max":22,"attempted":25,"total":25},"4-M":{"avg":7.46,"max":34,"attempted":25,"total":25}}},{"schoolId":13,"cells":{"2-E":{"avg":8.0,"max":15,"attempted":17,"total":17},"2-M":{"avg":15.97,"max":29,"attempted":17,"total":17},"3-E":{"avg":4.67,"max":20,"attempted":15,"total":15},"3-M":{"avg":16.57,"max":36,"attempted":15,"total":15},"4-E":{"avg":5.41,"max":22,"attempted":23,"total":23},"4-M":{"avg":16.85,"max":34,"attempted":23,"total":23},"5-E":{"avg":3.0,"max":28,"attempted":18,"total":18},"5-M":{"avg":8.83,"max":31,"attempted":18,"total":18}}},{"schoolId":14,"cells":{"2-E":{"avg":10.27,"max":15,"attempted":11,"total":11},"2-M":{"avg":8.82,"max":29,"attempted":11,"total":11},"3-E":{"avg":6.67,"max":20,"attempted":9,"total":9},"3-M":{"avg":12.56,"max":36,"attempted":9,"total":9}}},{"schoolId":18,"cells":{"2-E":{"avg":7.67,"max":15,"attempted":6,"total":6},"2-M":{"avg":8.42,"max":29,"attempted":6,"total":6},"3-E":{"avg":6.14,"max":20,"attempted":7,"total":7},"3-M":{"avg":7.64,"max":36,"attempted":7,"total":7},"4-E":{"avg":4.08,"max":22,"attempted":6,"total":6},"4-M":{"avg":5.67,"max":34,"attempted":6,"total":6},"5-E":{"avg":1.62,"max":28,"attempted":4,"total":4},"5-M":{"avg":3.25,"max":31,"attempted":4,"total":4}}},{"schoolId":20,"cells":{"2-E":{"avg":6.86,"max":15,"attempted":7,"total":7},"2-M":{"avg":11.0,"max":29,"attempted":7,"total":7},"3-E":{"avg":6.38,"max":20,"attempted":8,"total":8},"3-M":{"avg":11.38,"max":36,"attempted":8,"total":8}}},{"schoolId":22,"cells":{"2-E":{"avg":5.5,"max":15,"attempted":4,"total":4},"2-M":{"avg":11.5,"max":29,"attempted":4,"total":4},"3-E":{"avg":4.6,"max":20,"attempted":5,"total":5},"3-M":{"avg":6.9,"max":36,"attempted":5,"total":5},"4-E":{"avg":6.17,"max":22,"attempted":3,"total":3},"4-M":{"avg":16.0,"max":34,"attempted":3,"total":3},"5-E":{"avg":5.08,"max":28,"attempted":6,"total":6},"5-M":{"avg":15.5,"max":31,"attempted":6,"total":6}}},{"schoolId":23,"cells":{"2-E":{"avg":12.4,"max":15,"attempted":5,"total":5},"2-M":{"avg":18.2,"max":29,"attempted":5,"total":5},"3-E":{"avg":11.33,"max":20,"attempted":9,"total":9},"3-M":{"avg":18.22,"max":36,"attempted":9,"total":9},"4-E":{"avg":6.56,"max":22,"attempted":8,"total":8},"4-M":{"avg":15.81,"max":34,"attempted":8,"total":8},"5-E":{"avg":8.32,"max":28,"attempted":11,"total":11},"5-M":{"avg":10.23,"max":31,"attempted":11,"total":11}}},{"schoolId":24,"cells":{"2-E":{"avg":8.0,"max":15,"attempted":7,"total":7},"2-M":{"avg":9.5,"max":29,"attempted":7,"total":7},"3-E":{"avg":7.25,"max":20,"attempted":4,"total":4},"3-M":{"avg":10.88,"max":36,"attempted":4,"total":4},"4-E":{"avg":1.0,"max":22,"attempted":2,"total":2},"4-M":{"avg":1.75,"max":34,"attempted":2,"total":2},"5-E":{"avg":0.0,"max":28,"attempted":1,"total":1},"5-M":{"avg":0.0,"max":31,"attempted":1,"total":1}}},{"schoolId":25,"cells":{"3-E":{"avg":4.0,"max":20,"attempted":3,"total":3},"3-M":{"avg":2.67,"max":36,"attempted":3,"total":3},"4-E":{"avg":5.6,"max":22,"attempted":5,"total":5},"4-M":{"avg":8.7,"max":34,"attempted":5,"total":5},"5-E":{"avg":16.5,"max":28,"attempted":1,"total":1},"5-M":{"avg":22.5,"max":31,"attempted":1,"total":1}}},{"schoolId":26,"cells":{"5-E":{"avg":7.39,"max":28,"attempted":18,"total":18},"5-M":{"avg":13.72,"max":31,"attempted":18,"total":18}}},{"schoolId":37,"cells":{"3-E":{"avg":7.33,"max":20,"attempted":3,"total":3},"3-M":{"avg":7.0,"max":36,"attempted":3,"total":3},"4-E":{"avg":5.3,"max":22,"attempted":5,"total":5},"4-M":{"avg":8.8,"max":34,"attempted":5,"total":5},"5-E":{"avg":4.64,"max":28,"attempted":7,"total":7},"5-M":{"avg":8.29,"max":31,"attempted":7,"total":7}}},{"schoolId":38,"cells":{"2-E":{"avg":12.25,"max":15,"attempted":4,"total":4},"2-M":{"avg":22.0,"max":29,"attempted":4,"total":4},"3-E":{"avg":10.5,"max":20,"attempted":4,"total":4},"3-M":{"avg":22.62,"max":36,"attempted":4,"total":4},"4-E":{"avg":11.67,"max":22,"attempted":6,"total":6},"4-M":{"avg":23.5,"max":34,"attempted":6,"total":6},"5-E":{"avg":13.0,"max":28,"attempted":2,"total":2},"5-M":{"avg":24.5,"max":31,"attempted":2,"total":2}}},{"schoolId":44,"cells":{"2-E":{"avg":3.96,"max":15,"attempted":26,"total":26},"2-M":{"avg":4.69,"max":29,"attempted":26,"total":26},"3-E":{"avg":1.17,"max":20,"attempted":24,"total":24},"3-M":{"avg":3.48,"max":36,"attempted":24,"total":24},"4-E":{"avg":5.09,"max":22,"attempted":11,"total":11},"4-M":{"avg":8.0,"max":34,"attempted":11,"total":11},"5-E":{"avg":3.09,"max":28,"attempted":17,"total":17},"5-M":{"avg":3.97,"max":31,"attempted":17,"total":17}}},{"schoolId":45,"cells":{"2-E":{"avg":8.19,"max":15,"attempted":16,"total":16},"2-M":{"avg":11.03,"max":29,"attempted":16,"total":16},"3-E":{"avg":9.47,"max":20,"attempted":19,"total":19},"3-M":{"avg":18.39,"max":36,"attempted":19,"total":19},"4-E":{"avg":7.74,"max":22,"attempted":17,"total":17},"4-M":{"avg":12.06,"max":34,"attempted":17,"total":17},"5-E":{"avg":10.07,"max":28,"attempted":7,"total":7},"5-M":{"avg":11.21,"max":31,"attempted":7,"total":7}}},{"schoolId":49,"cells":{"2-E":{"avg":7.73,"max":15,"attempted":11,"total":11},"2-M":{"avg":10.05,"max":29,"attempted":11,"total":11},"5-E":{"avg":3.33,"max":28,"attempted":6,"total":6},"5-M":{"avg":10.75,"max":31,"attempted":6,"total":6}}},{"schoolId":51,"cells":{"2-E":{"avg":12.0,"max":15,"attempted":7,"total":7},"2-M":{"avg":22.5,"max":29,"attempted":7,"total":7},"3-E":{"avg":10.4,"max":20,"attempted":5,"total":5},"3-M":{"avg":18.3,"max":36,"attempted":5,"total":5},"4-E":{"avg":8.31,"max":22,"attempted":8,"total":8},"4-M":{"avg":23.25,"max":34,"attempted":8,"total":8},"5-E":{"avg":7.83,"max":28,"attempted":9,"total":9},"5-M":{"avg":13.06,"max":31,"attempted":9,"total":9}}},{"schoolId":53,"cells":{"2-E":{"avg":5.0,"max":15,"attempted":5,"total":5},"2-M":{"avg":4.8,"max":29,"attempted":5,"total":5}}},{"schoolId":54,"cells":{"5-E":{"avg":4.28,"max":28,"attempted":18,"total":18},"5-M":{"avg":7.56,"max":31,"attempted":18,"total":18}}},{"schoolId":63,"cells":{"2-E":{"avg":8.35,"max":15,"attempted":17,"total":17},"2-M":{"avg":12.38,"max":29,"attempted":17,"total":17},"3-E":{"avg":5.25,"max":20,"attempted":8,"total":8},"3-M":{"avg":7.12,"max":36,"attempted":8,"total":8},"4-E":{"avg":5.2,"max":22,"attempted":10,"total":10},"4-M":{"avg":9.05,"max":34,"attempted":10,"total":10},"5-E":{"avg":4.56,"max":28,"attempted":8,"total":8},"5-M":{"avg":7.19,"max":31,"attempted":8,"total":8}}},{"schoolId":66,"cells":{"2-E":{"avg":7.86,"max":15,"attempted":7,"total":7},"2-M":{"avg":12.79,"max":29,"attempted":7,"total":7},"3-E":{"avg":11.29,"max":20,"attempted":7,"total":7},"3-M":{"avg":19.79,"max":36,"attempted":7,"total":7},"4-E":{"avg":11.44,"max":22,"attempted":9,"total":9},"4-M":{"avg":21.06,"max":34,"attempted":9,"total":9},"5-E":{"avg":14.39,"max":28,"attempted":9,"total":9},"5-M":{"avg":19.89,"max":31,"attempted":9,"total":9}}},{"schoolId":67,"cells":{"2-E":{"avg":15.0,"max":15,"attempted":1,"total":1},"2-M":{"avg":18.0,"max":29,"attempted":1,"total":1},"3-E":{"avg":9.83,"max":20,"attempted":6,"total":6},"3-M":{"avg":14.33,"max":36,"attempted":6,"total":6},"4-E":{"avg":10.75,"max":22,"attempted":4,"total":4},"4-M":{"avg":19.38,"max":34,"attempted":4,"total":4},"5-E":{"avg":12.46,"max":28,"attempted":13,"total":13},"5-M":{"avg":18.19,"max":31,"attempted":13,"total":13}}},{"schoolId":69,"cells":{"2-E":{"avg":6.24,"max":15,"attempted":25,"total":25},"2-M":{"avg":10.8,"max":29,"attempted":25,"total":25},"3-E":{"avg":2.36,"max":20,"attempted":25,"total":25},"3-M":{"avg":4.48,"max":36,"attempted":25,"total":25},"4-E":{"avg":3.54,"max":22,"attempted":27,"total":27},"4-M":{"avg":8.52,"max":34,"attempted":27,"total":27},"5-E":{"avg":4.21,"max":28,"attempted":19,"total":19},"5-M":{"avg":10.82,"max":31,"attempted":19,"total":19}}}]},"oralStatus":{"English":[{"class":1,"Pre Letter":39.72,"Capital Letter":14.98,"Small Letter":28.57,"Read Words":0.35,"Understand Words":0.7,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":15.82,"Capital Letter":7.41,"Small Letter":42.76,"Read Words":6.73,"Understand Words":14.81,"Read Sentence":2.02,"Understand Sentence":0.34,"Direct Test":0.0},{"class":3,"Pre Letter":5.69,"Capital Letter":3.66,"Small Letter":39.84,"Read Words":7.72,"Understand Words":17.48,"Read Sentence":8.13,"Understand Sentence":3.25,"Direct Test":0.0},{"class":4,"Pre Letter":1.52,"Capital Letter":1.52,"Small Letter":29.29,"Read Words":8.59,"Understand Words":17.17,"Read Sentence":15.15,"Understand Sentence":14.14,"Direct Test":0.0},{"class":5,"Pre Letter":2.14,"Capital Letter":2.14,"Small Letter":25.64,"Read Words":6.84,"Understand Words":14.96,"Read Sentence":19.23,"Understand Sentence":19.66,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":25.44,"One Digit Numbers":48.08,"Two Digit Numbers":8.36,"Addition":2.44,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":4.71,"One Digit Numbers":26.6,"Two Digit Numbers":14.81,"Addition":39.06,"Subtraction":4.71,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":0.81,"One Digit Numbers":10.98,"Two Digit Numbers":7.72,"Addition":42.68,"Subtraction":19.51,"Multiplication":3.66,"Division":0.41},{"class":4,"Pre Numbers":0.0,"One Digit Numbers":3.03,"Two Digit Numbers":2.02,"Addition":29.29,"Subtraction":34.85,"Multiplication":11.11,"Division":7.07},{"class":5,"Pre Numbers":0.0,"One Digit Numbers":5.13,"Two Digit Numbers":3.42,"Addition":21.79,"Subtraction":19.66,"Multiplication":12.39,"Division":28.21}],"Tamil":[{"class":1,"Letter":30.66,"Word":5.92,"Sentence":0.0,"Paragraph":0.0},{"class":2,"Letter":25.93,"Word":41.08,"Sentence":8.75,"Paragraph":0.34},{"class":3,"Letter":13.01,"Word":37.8,"Sentence":20.33,"Paragraph":6.91},{"class":4,"Letter":6.57,"Word":23.23,"Sentence":34.34,"Paragraph":22.22},{"class":5,"Letter":2.99,"Word":18.8,"Sentence":29.91,"Paragraph":36.75}]},"overallScores":{"English":[{"class":1,"writtenScorePct":null,"oralProgressPct":12.9},{"class":2,"writtenScorePct":61.9,"oralProgressPct":29.3},{"class":3,"writtenScorePct":33.0,"oralProgressPct":39.4},{"class":4,"writtenScorePct":30.7,"oralProgressPct":51.5},{"class":5,"writtenScorePct":26.0,"oralProgressPct":54.9}],"Maths":[{"class":1,"writtenScorePct":null,"oralProgressPct":14.3},{"class":2,"writtenScorePct":43.5,"oralProgressPct":35.6},{"class":3,"writtenScorePct":33.4,"oralProgressPct":49.2},{"class":4,"writtenScorePct":40.0,"oralProgressPct":63.4},{"class":5,"writtenScorePct":37.5,"oralProgressPct":71.2}],"Tamil":[{"class":1,"writtenScorePct":null,"oralProgressPct":5.4},{"class":2,"writtenScorePct":null,"oralProgressPct":26.1},{"class":3,"writtenScorePct":null,"oralProgressPct":42.4},{"class":4,"writtenScorePct":null,"oralProgressPct":61.2},{"class":5,"writtenScorePct":null,"oralProgressPct":71.2}]},"oralProgression":{"English":[{"class":1,"Pre Letter":84.3,"Capital Letter":44.6,"Small Letter":29.6,"Read Words":1.0,"Understand Words":0.7,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":89.9,"Capital Letter":74.1,"Small Letter":66.7,"Read Words":23.9,"Understand Words":17.2,"Read Sentence":2.4,"Understand Sentence":0.3,"Direct Test":0.0},{"class":3,"Pre Letter":85.8,"Capital Letter":80.1,"Small Letter":76.4,"Read Words":36.6,"Understand Words":28.9,"Read Sentence":11.4,"Understand Sentence":3.3,"Direct Test":0.0},{"class":4,"Pre Letter":87.4,"Capital Letter":85.9,"Small Letter":84.3,"Read Words":55.1,"Understand Words":46.5,"Read Sentence":29.3,"Understand Sentence":14.1,"Direct Test":0.0},{"class":5,"Pre Letter":90.6,"Capital Letter":88.5,"Small Letter":86.3,"Read Words":60.7,"Understand Words":53.8,"Read Sentence":38.9,"Understand Sentence":19.7,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":84.3,"One Digit Numbers":58.9,"Two Digit Numbers":10.8,"Addition":2.4,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":89.9,"One Digit Numbers":85.2,"Two Digit Numbers":58.6,"Addition":43.8,"Subtraction":4.7,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":85.8,"One Digit Numbers":85.0,"Two Digit Numbers":74.0,"Addition":66.3,"Subtraction":23.6,"Multiplication":4.1,"Division":0.4},{"class":4,"Pre Numbers":87.4,"One Digit Numbers":87.4,"Two Digit Numbers":84.3,"Addition":82.3,"Subtraction":53.0,"Multiplication":18.2,"Division":7.1},{"class":5,"Pre Numbers":90.6,"One Digit Numbers":90.6,"Two Digit Numbers":85.5,"Addition":82.1,"Subtraction":60.3,"Multiplication":40.6,"Division":28.2}],"Tamil":[{"class":1,"Letter":36.6,"Word":5.9,"Sentence":0.0,"Paragraph":0.0},{"class":2,"Letter":76.1,"Word":50.2,"Sentence":9.1,"Paragraph":0.3},{"class":3,"Letter":78.0,"Word":65.0,"Sentence":27.2,"Paragraph":6.9},{"class":4,"Letter":86.4,"Word":79.8,"Sentence":56.6,"Paragraph":22.2},{"class":5,"Letter":88.5,"Word":85.5,"Sentence":66.7,"Paragraph":36.8}]},"writtenQuestionwise":{"2":{"English":[{"q":"1.i","avgPct":50.0},{"q":"1.ii","avgPct":10.0},{"q":"1.iii","avgPct":30.0},{"q":"2.i","avgPct":100.0},{"q":"2.ii","avgPct":60.0},{"q":"2.iii","avgPct":100.0},{"q":"3.i","avgPct":100.0},{"q":"3.ii","avgPct":90.0},{"q":"3.iii","avgPct":90.0},{"q":"4.i","avgPct":50.0},{"q":"4.ii","avgPct":30.0},{"q":"4.iii","avgPct":80.0},{"q":"5.i","avgPct":100.0},{"q":"5.ii","avgPct":70.0},{"q":"5.iii","avgPct":80.0}],"Maths":[{"q":"1","avgPct":90.0},{"q":"2","avgPct":40.0},{"q":"3.i","avgPct":20.0},{"q":"3.ii","avgPct":90.0},{"q":"3.iii","avgPct":20.0},{"q":"3.iv","avgPct":60.0},{"q":"4.i","avgPct":30.0},{"q":"4.ii","avgPct":40.0},{"q":"4.iii","avgPct":75.0},{"q":"4.iv","avgPct":35.0},{"q":"5.i","avgPct":10.0},{"q":"5.ii","avgPct":30.0},{"q":"5.iii","avgPct":35.0},{"q":"5.iv","avgPct":10.0},{"q":"6.i","avgPct":70.0},{"q":"6.ii","avgPct":70.0},{"q":"6.iii","avgPct":50.0},{"q":"6.iv","avgPct":40.0},{"q":"6.v","avgPct":60.0},{"q":"6.vi","avgPct":60.0},{"q":"7","avgPct":60.0},{"q":"8","avgPct":70.0},{"q":"9.i","avgPct":20.0},{"q":"9.ii","avgPct":20.0},{"q":"10.i","avgPct":70.0},{"q":"10.ii","avgPct":50.0},{"q":"10.iii","avgPct":30.0},{"q":"11.i","avgPct":70.0},{"q":"11.ii","avgPct":50.0},{"q":"11.iii","avgPct":80.0}]},"5":{"English":[{"q":"1.i","avgPct":26.2},{"q":"1.ii","avgPct":4.8},{"q":"1.iii","avgPct":9.5},{"q":"2.i","avgPct":9.5},{"q":"2.ii","avgPct":14.3},{"q":"2.iii","avgPct":38.1},{"q":"2.iv","avgPct":19.0},{"q":"3i","avgPct":47.6},{"q":"3ii","avgPct":47.6},{"q":"3iii","avgPct":66.7},{"q":"3iv","avgPct":28.6},{"q":"4i","avgPct":14.3},{"q":"4ii","avgPct":4.8},{"q":"4iii","avgPct":57.1},{"q":"5i","avgPct":40.5},{"q":"5ii","avgPct":14.3},{"q":"5iii","avgPct":23.8},{"q":"6i","avgPct":4.8},{"q":"6ii","avgPct":4.8},{"q":"6iii","avgPct":47.6},{"q":"7i","avgPct":4.8},{"q":"7ii","avgPct":23.8},{"q":"7iii","avgPct":0.0},{"q":"7iv","avgPct":0.0}],"Maths":[{"q":"1.i","avgPct":80.0},{"q":"1.ii","avgPct":10.0},{"q":"2","avgPct":2.5},{"q":"3","avgPct":55.0},{"q":"4","avgPct":7.5},{"q":"5","avgPct":45.0},{"q":"6","avgPct":45.0},{"q":"7","avgPct":17.5},{"q":"8","avgPct":7.5},{"q":"9","avgPct":57.5},{"q":"10","avgPct":10.0},{"q":"11.i","avgPct":55.0},{"q":"11.ii","avgPct":55.0},{"q":"11.iii","avgPct":75.0},{"q":"12.i","avgPct":40.0},{"q":"12.ii","avgPct":90.0},{"q":"12.iii","avgPct":85.0},{"q":"13","avgPct":0.0},{"q":"14.i","avgPct":35.0},{"q":"14.ii","avgPct":10.0},{"q":"14.iii","avgPct":10.0},{"q":"14.iv","avgPct":10.0},{"q":"14.v","avgPct":25.0},{"q":"14.vi","avgPct":10.0},{"q":"14.vii","avgPct":50.0},{"q":"15","avgPct":7.5}]}}},"2022":{"schoolAverages":{"classSubjectCols":["1-E","1-M","2-E","2-M","3-E","3-M","4-E","4-M","5-E","5-M","6-E","6-M"],"schools":[{"schoolId":8,"cells":{"2-E":{"avg":5.23,"max":13,"attempted":13,"total":13},"2-M":{"avg":11.19,"max":29,"attempted":13,"total":13}}},{"schoolId":44,"cells":{"2-E":{"avg":2.48,"max":13,"attempted":21,"total":21},"3-E":{"avg":1.52,"max":16,"attempted":20,"total":20},"4-E":{"avg":1.88,"max":18,"attempted":4,"total":4},"2-M":{"avg":4.57,"max":29,"attempted":21,"total":21},"3-M":{"avg":1.9,"max":35,"attempted":20,"total":20},"4-M":{"avg":3.0,"max":33,"attempted":4,"total":4}}},{"schoolId":54,"cells":{"2-E":{"avg":1.75,"max":13,"attempted":4,"total":4},"3-E":{"avg":0.3,"max":16,"attempted":10,"total":10},"4-E":{"avg":0.5,"max":18,"attempted":17,"total":17},"5-E":{"avg":0.81,"max":25,"attempted":8,"total":8},"2-M":{"avg":3.25,"max":29,"attempted":4,"total":4},"3-M":{"avg":2.1,"max":35,"attempted":10,"total":10},"4-M":{"avg":3.24,"max":33,"attempted":17,"total":17},"5-M":{"avg":6.25,"max":34,"attempted":8,"total":8}}}]},"oralStatus":{"English":[{"class":1,"Pre Letter":37.7,"Capital Letter":11.48,"Small Letter":18.03,"Read Words":0.0,"Understand Words":3.28,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":18.42,"Capital Letter":7.89,"Small Letter":28.95,"Read Words":0.0,"Understand Words":7.89,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":3,"Pre Letter":23.33,"Capital Letter":13.33,"Small Letter":20.0,"Read Words":3.33,"Understand Words":0.0,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":4,"Pre Letter":0.0,"Capital Letter":9.52,"Small Letter":23.81,"Read Words":4.76,"Understand Words":33.33,"Read Sentence":4.76,"Understand Sentence":0.0,"Direct Test":0.0},{"class":5,"Pre Letter":0.0,"Capital Letter":0.0,"Small Letter":37.5,"Read Words":12.5,"Understand Words":0.0,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":21.31,"One Digit Numbers":36.07,"Two Digit Numbers":4.92,"Addition":8.2,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":5.26,"One Digit Numbers":34.21,"Two Digit Numbers":5.26,"Addition":13.16,"Subtraction":5.26,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":6.67,"One Digit Numbers":26.67,"Two Digit Numbers":3.33,"Addition":23.33,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":4,"Pre Numbers":0.0,"One Digit Numbers":0.0,"Two Digit Numbers":0.0,"Addition":42.86,"Subtraction":19.05,"Multiplication":14.29,"Division":0.0},{"class":5,"Pre Numbers":0.0,"One Digit Numbers":0.0,"Two Digit Numbers":0.0,"Addition":12.5,"Subtraction":0.0,"Multiplication":12.5,"Division":25.0}],"Tamil":[{"class":1,"Letter":24.59,"Word":8.2,"Sentence":0.0,"Paragraph":0.0},{"class":2,"Letter":26.32,"Word":13.16,"Sentence":0.0,"Paragraph":0.0},{"class":3,"Letter":23.33,"Word":6.67,"Sentence":0.0,"Paragraph":0.0},{"class":4,"Letter":4.76,"Word":9.52,"Sentence":47.62,"Paragraph":9.52},{"class":5,"Letter":12.5,"Word":12.5,"Sentence":25.0,"Paragraph":0.0}]},"overallScores":{"English":[{"class":1,"writtenScorePct":null,"oralProgressPct":12.3},{"class":2,"writtenScorePct":37.6,"oralProgressPct":22.0},{"class":3,"writtenScorePct":11.6,"oralProgressPct":15.1},{"class":4,"writtenScorePct":5.6,"oralProgressPct":42.9},{"class":5,"writtenScorePct":6.5,"oralProgressPct":32.1}],"Maths":[{"class":1,"writtenScorePct":null,"oralProgressPct":16.7},{"class":2,"writtenScorePct":33.8,"oralProgressPct":27.8},{"class":3,"writtenScorePct":9.4,"oralProgressPct":28.7},{"class":4,"writtenScorePct":12.7,"oralProgressPct":60.4},{"class":5,"writtenScorePct":36.8,"oralProgressPct":83.3}],"Tamil":[{"class":1,"writtenScorePct":null,"oralProgressPct":8.3},{"class":2,"writtenScorePct":null,"oralProgressPct":11.1},{"class":3,"writtenScorePct":null,"oralProgressPct":7.4},{"class":4,"writtenScorePct":null,"oralProgressPct":62.2},{"class":5,"writtenScorePct":null,"oralProgressPct":41.7}]},"oralProgression":{"English":[{"class":1,"Pre Letter":70.5,"Capital Letter":32.8,"Small Letter":21.3,"Read Words":3.3,"Understand Words":3.3,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":2,"Pre Letter":63.2,"Capital Letter":44.7,"Small Letter":36.8,"Read Words":7.9,"Understand Words":7.9,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":3,"Pre Letter":60.0,"Capital Letter":36.7,"Small Letter":23.3,"Read Words":3.3,"Understand Words":0.0,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0},{"class":4,"Pre Letter":76.2,"Capital Letter":76.2,"Small Letter":66.7,"Read Words":42.9,"Understand Words":38.1,"Read Sentence":4.8,"Understand Sentence":0.0,"Direct Test":0.0},{"class":5,"Pre Letter":50.0,"Capital Letter":50.0,"Small Letter":50.0,"Read Words":12.5,"Understand Words":0.0,"Read Sentence":0.0,"Understand Sentence":0.0,"Direct Test":0.0}],"Maths":[{"class":1,"Pre Numbers":70.5,"One Digit Numbers":49.2,"Two Digit Numbers":13.1,"Addition":8.2,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":2,"Pre Numbers":63.2,"One Digit Numbers":57.9,"Two Digit Numbers":23.7,"Addition":18.4,"Subtraction":5.3,"Multiplication":0.0,"Division":0.0},{"class":3,"Pre Numbers":60.0,"One Digit Numbers":53.3,"Two Digit Numbers":26.7,"Addition":23.3,"Subtraction":0.0,"Multiplication":0.0,"Division":0.0},{"class":4,"Pre Numbers":76.2,"One Digit Numbers":76.2,"Two Digit Numbers":76.2,"Addition":76.2,"Subtraction":33.3,"Multiplication":14.3,"Division":0.0},{"class":5,"Pre Numbers":50.0,"One Digit Numbers":50.0,"Two Digit Numbers":50.0,"Addition":50.0,"Subtraction":37.5,"Multiplication":37.5,"Division":25.0}],"Tamil":[{"class":1,"Letter":32.8,"Word":8.2,"Sentence":0.0,"Paragraph":0.0},{"class":2,"Letter":39.5,"Word":13.2,"Sentence":0.0,"Paragraph":0.0},{"class":3,"Letter":30.0,"Word":6.7,"Sentence":0.0,"Paragraph":0.0},{"class":4,"Letter":71.4,"Word":66.7,"Sentence":57.1,"Paragraph":9.5},{"class":5,"Letter":50.0,"Word":37.5,"Sentence":25.0,"Paragraph":0.0}]},"writtenQuestionwise":{}}},"csSchoolAverages":{"schools":[],"note":"No CS assessment score records exist in this data sample (CS papers only start 2024, while the sampled assessmentscores rows only go up to 2020-22)."}};

const SCHOOL_PROFILE = {"2016":{},"2017":{"1":{"stPct":22.0,"scPct":22.0,"rte":9,"teachers":4,"strength":70,"absentees":12.0,"bplPct":null,"attendance":null},"26":{"stPct":0.0,"scPct":78.08,"rte":7,"teachers":3,"strength":66,"absentees":3.0,"bplPct":null,"attendance":null},"64":{"stPct":0.0,"scPct":69.57,"rte":9,"teachers":2,"strength":44,"absentees":3.0,"bplPct":null,"attendance":null},"35":{"stPct":0.0,"scPct":81.4,"rte":9,"teachers":3,"strength":71,"absentees":18.0,"bplPct":null,"attendance":null},"63":{"stPct":36.73,"scPct":20.41,"rte":10,"teachers":2,"strength":46,"absentees":2.0,"bplPct":null,"attendance":null},"4":{"stPct":6.67,"scPct":73.33,"rte":10,"teachers":3,"strength":41,"absentees":10.0,"bplPct":null,"attendance":null},"25":{"stPct":0.0,"scPct":62.5,"rte":8,"teachers":2,"strength":13,"absentees":2.0,"bplPct":null,"attendance":null},"2":{"stPct":8.7,"scPct":59.13,"rte":9,"teachers":5,"strength":123,"absentees":15.0,"bplPct":null,"attendance":null},"39":{"stPct":4.55,"scPct":59.09,"rte":9,"teachers":2,"strength":28,"absentees":4.0,"bplPct":null,"attendance":null},"40":{"stPct":0.08,"scPct":1.01,"rte":10,"teachers":2,"strength":49,"absentees":6.0,"bplPct":null,"attendance":null},"5":{"stPct":4.03,"scPct":55.7,"rte":10,"teachers":4,"strength":91,"absentees":17.0,"bplPct":null,"attendance":null},"37":{"stPct":21.88,"scPct":25.0,"rte":8,"teachers":2,"strength":27,"absentees":5.0,"bplPct":null,"attendance":null},"3":{"stPct":93.33,"scPct":0.0,"rte":9,"teachers":3,"strength":60,"absentees":6.0,"bplPct":null,"attendance":null},"20":{"stPct":11.86,"scPct":61.02,"rte":10,"teachers":2,"strength":48,"absentees":4.0,"bplPct":null,"attendance":null},"21":{"stPct":10.0,"scPct":35.0,"rte":10,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"22":{"stPct":0.0,"scPct":25.0,"rte":8,"teachers":2,"strength":28,"absentees":3.0,"bplPct":null,"attendance":null},"38":{"stPct":4.0,"scPct":28.0,"rte":10,"teachers":2,"strength":22,"absentees":2.0,"bplPct":null,"attendance":null},"23":{"stPct":0.0,"scPct":0.0,"rte":7,"teachers":2,"strength":40,"absentees":1.0,"bplPct":null,"attendance":null},"53":{"stPct":19.35,"scPct":9.68,"rte":10,"teachers":2,"strength":25,"absentees":0.0,"bplPct":null,"attendance":null},"28":{"stPct":20.69,"scPct":37.93,"rte":8,"teachers":2,"strength":23,"absentees":5.0,"bplPct":null,"attendance":null},"31":{"stPct":0.0,"scPct":23.68,"rte":10,"teachers":2,"strength":38,"absentees":10.0,"bplPct":null,"attendance":null},"52":{"stPct":0.0,"scPct":68.75,"rte":8,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"34":{"stPct":32.43,"scPct":43.24,"rte":10,"teachers":2,"strength":36,"absentees":4.0,"bplPct":null,"attendance":null},"6":{"stPct":4.44,"scPct":11.11,"rte":10,"teachers":3,"strength":45,"absentees":6.0,"bplPct":null,"attendance":null},"36":{"stPct":5.56,"scPct":33.33,"rte":7,"teachers":2,"strength":31,"absentees":3.0,"bplPct":null,"attendance":null},"50":{"stPct":35.0,"scPct":10.0,"rte":10,"teachers":2,"strength":11,"absentees":3.0,"bplPct":null,"attendance":null},"54":{"stPct":20.45,"scPct":52.27,"rte":10,"teachers":3,"strength":79,"absentees":8.0,"bplPct":null,"attendance":null},"41":{"stPct":25.67,"scPct":39.04,"rte":10,"teachers":4,"strength":89,"absentees":31.0,"bplPct":null,"attendance":null},"42":{"stPct":10.2,"scPct":30.61,"rte":10,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"9":{"stPct":0.0,"scPct":68.12,"rte":9,"teachers":4,"strength":70,"absentees":10.0,"bplPct":null,"attendance":null},"8":{"stPct":0.0,"scPct":36.0,"rte":7,"teachers":3,"strength":52,"absentees":6.0,"bplPct":null,"attendance":null},"24":{"stPct":22.22,"scPct":33.33,"rte":10,"teachers":2,"strength":33,"absentees":2.0,"bplPct":null,"attendance":null},"7":{"stPct":35.29,"scPct":35.29,"rte":10,"teachers":4,"strength":68,"absentees":20.0,"bplPct":null,"attendance":null},"18":{"stPct":60.0,"scPct":0.0,"rte":10,"teachers":3,"strength":30,"absentees":2.0,"bplPct":null,"attendance":null},"60":{"stPct":0.0,"scPct":58.97,"rte":8,"teachers":2,"strength":35,"absentees":2.0,"bplPct":null,"attendance":null},"27":{"stPct":7.14,"scPct":0.0,"rte":9,"teachers":2,"strength":22,"absentees":1.0,"bplPct":null,"attendance":null},"51":{"stPct":0.0,"scPct":51.52,"rte":8,"teachers":2,"strength":26,"absentees":3.0,"bplPct":null,"attendance":null},"29":{"stPct":0.0,"scPct":44.25,"rte":8,"teachers":5,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"57":{"stPct":3.23,"scPct":64.52,"rte":9,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"56":{"stPct":3.13,"scPct":28.13,"rte":10,"teachers":2,"strength":17,"absentees":2.0,"bplPct":null,"attendance":null},"10":{"stPct":14.93,"scPct":7.46,"rte":8,"teachers":4,"strength":57,"absentees":3.0,"bplPct":null,"attendance":null},"30":{"stPct":1.79,"scPct":33.04,"rte":8,"teachers":3,"strength":101,"absentees":7.0,"bplPct":null,"attendance":null},"32":{"stPct":34.21,"scPct":15.79,"rte":8,"teachers":3,"strength":29,"absentees":10.0,"bplPct":null,"attendance":null},"33":{"stPct":3.13,"scPct":28.13,"rte":9,"teachers":2,"strength":29,"absentees":0.0,"bplPct":null,"attendance":null},"55":{"stPct":4.88,"scPct":56.1,"rte":9,"teachers":2,"strength":36,"absentees":4.0,"bplPct":null,"attendance":null},"44":{"stPct":81.36,"scPct":1.69,"rte":7,"teachers":4,"strength":95,"absentees":40.0,"bplPct":null,"attendance":null},"11":{"stPct":0.0,"scPct":34.0,"rte":7,"teachers":5,"strength":93,"absentees":15.0,"bplPct":null,"attendance":null},"45":{"stPct":9.42,"scPct":47.83,"rte":7,"teachers":5,"strength":105,"absentees":10.0,"bplPct":null,"attendance":null},"43":{"stPct":1.01,"scPct":24.62,"rte":10,"teachers":4,"strength":104,"absentees":33.0,"bplPct":null,"attendance":null},"15":{"stPct":0.68,"scPct":24.32,"rte":7,"teachers":6,"strength":121,"absentees":37.0,"bplPct":null,"attendance":null},"14":{"stPct":0.0,"scPct":22.73,"rte":10,"teachers":3,"strength":54,"absentees":6.0,"bplPct":null,"attendance":null},"17":{"stPct":0.0,"scPct":37.89,"rte":10,"teachers":38,"strength":109,"absentees":21.0,"bplPct":null,"attendance":null},"68":{"stPct":16.07,"scPct":66.07,"rte":8,"teachers":7,"strength":135,"absentees":26.0,"bplPct":null,"attendance":null},"65":{"stPct":0.0,"scPct":0.0,"rte":6,"teachers":3,"strength":36,"absentees":4.0,"bplPct":null,"attendance":null},"69":{"stPct":1.69,"scPct":54.43,"rte":10,"teachers":7,"strength":120,"absentees":8.0,"bplPct":null,"attendance":null},"66":{"stPct":0.0,"scPct":30.36,"rte":8,"teachers":3,"strength":49,"absentees":1.0,"bplPct":null,"attendance":null},"67":{"stPct":0.0,"scPct":2.86,"rte":8,"teachers":3,"strength":43,"absentees":11.0,"bplPct":null,"attendance":null},"12":{"stPct":0.0,"scPct":1.85,"rte":8,"teachers":9,"strength":214,"absentees":20.0,"bplPct":null,"attendance":null},"13":{"stPct":0.0,"scPct":0.74,"rte":10,"teachers":4,"strength":81,"absentees":6.0,"bplPct":null,"attendance":null},"49":{"stPct":0.0,"scPct":70.83,"rte":7,"teachers":4,"strength":71,"absentees":3.0,"bplPct":null,"attendance":null}},"2018":{"1":{"stPct":26.0,"scPct":27.0,"rte":8,"teachers":4,"strength":62,"absentees":7.0,"bplPct":null,"attendance":null},"26":{"stPct":0.0,"scPct":76.47,"rte":6,"teachers":3,"strength":63,"absentees":6.0,"bplPct":null,"attendance":null},"64":{"stPct":2.0,"scPct":82.98,"rte":8,"teachers":2,"strength":49,"absentees":1.0,"bplPct":null,"attendance":null},"35":{"stPct":0.0,"scPct":80.0,"rte":8,"teachers":3,"strength":74,"absentees":17.0,"bplPct":null,"attendance":null},"63":{"stPct":42.0,"scPct":14.0,"rte":9,"teachers":2,"strength":50,"absentees":8.0,"bplPct":null,"attendance":null},"4":{"stPct":6.45,"scPct":74.19,"rte":9,"teachers":3,"strength":41,"absentees":5.0,"bplPct":null,"attendance":null},"25":{"stPct":0.0,"scPct":43.75,"rte":7,"teachers":2,"strength":15,"absentees":1.0,"bplPct":null,"attendance":null},"2":{"stPct":7.03,"scPct":55.47,"rte":6,"teachers":4,"strength":122,"absentees":20.0,"bplPct":null,"attendance":null},"39":{"stPct":5.95,"scPct":53.57,"rte":7,"teachers":2,"strength":29,"absentees":6.0,"bplPct":null,"attendance":null},"40":{"stPct":8.33,"scPct":3.13,"rte":7,"teachers":2,"strength":53,"absentees":3.0,"bplPct":null,"attendance":null},"5":{"stPct":4.76,"scPct":56.46,"rte":7,"teachers":5,"strength":76,"absentees":4.0,"bplPct":null,"attendance":null},"37":{"stPct":20.69,"scPct":24.14,"rte":7,"teachers":2,"strength":26,"absentees":3.0,"bplPct":null,"attendance":null},"3":{"stPct":95.24,"scPct":0.0,"rte":7,"teachers":3,"strength":60,"absentees":5.0,"bplPct":null,"attendance":null},"20":{"stPct":1.96,"scPct":72.55,"rte":8,"teachers":2,"strength":38,"absentees":3.0,"bplPct":null,"attendance":null},"21":{"stPct":11.0,"scPct":37.0,"rte":9,"teachers":2,"strength":32,"absentees":3.0,"bplPct":null,"attendance":null},"22":{"stPct":0.0,"scPct":39.0,"rte":7,"teachers":2,"strength":25,"absentees":2.0,"bplPct":null,"attendance":null},"38":{"stPct":4.0,"scPct":28.0,"rte":9,"teachers":2,"strength":19,"absentees":2.0,"bplPct":null,"attendance":null},"23":{"stPct":0.0,"scPct":0.0,"rte":6,"teachers":2,"strength":43,"absentees":3.0,"bplPct":null,"attendance":null},"53":{"stPct":14.29,"scPct":10.71,"rte":9,"teachers":2,"strength":28,"absentees":1.0,"bplPct":null,"attendance":null},"28":{"stPct":28.0,"scPct":36.0,"rte":7,"teachers":2,"strength":23,"absentees":3.0,"bplPct":null,"attendance":null},"31":{"stPct":0.0,"scPct":17.07,"rte":8,"teachers":2,"strength":36,"absentees":2.0,"bplPct":null,"attendance":null},"52":{"stPct":0.0,"scPct":80.0,"rte":7,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"34":{"stPct":41.03,"scPct":41.03,"rte":9,"teachers":2,"strength":36,"absentees":2.0,"bplPct":null,"attendance":null},"6":{"stPct":4.35,"scPct":8.7,"rte":9,"teachers":3,"strength":37,"absentees":5.0,"bplPct":null,"attendance":null},"36":{"stPct":5.88,"scPct":35.29,"rte":6,"teachers":2,"strength":22,"absentees":2.0,"bplPct":null,"attendance":null},"50":{"stPct":43.0,"scPct":7.0,"rte":9,"teachers":2,"strength":8,"absentees":2.0,"bplPct":null,"attendance":null},"54":{"stPct":17.81,"scPct":52.74,"rte":8,"teachers":4,"strength":78,"absentees":9.0,"bplPct":null,"attendance":null},"41":{"stPct":27.01,"scPct":35.63,"rte":8,"teachers":4,"strength":86,"absentees":28.0,"bplPct":null,"attendance":null},"42":{"stPct":9.41,"scPct":32.94,"rte":8,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"9":{"stPct":0.0,"scPct":66.2,"rte":8,"teachers":4,"strength":69,"absentees":8.0,"bplPct":null,"attendance":null},"8":{"stPct":0.0,"scPct":40.0,"rte":6,"teachers":3,"strength":48,"absentees":1.0,"bplPct":null,"attendance":null},"24":{"stPct":33.33,"scPct":33.33,"rte":9,"teachers":2,"strength":19,"absentees":2.0,"bplPct":null,"attendance":null},"7":{"stPct":39.44,"scPct":32.39,"rte":9,"teachers":4,"strength":71,"absentees":14.0,"bplPct":null,"attendance":null},"18":{"stPct":59.0,"scPct":0.0,"rte":9,"teachers":3,"strength":27,"absentees":2.0,"bplPct":null,"attendance":null},"60":{"stPct":0.0,"scPct":64.86,"rte":7,"teachers":2,"strength":35,"absentees":4.0,"bplPct":null,"attendance":null},"27":{"stPct":24.0,"scPct":0.0,"rte":8,"teachers":2,"strength":22,"absentees":5.0,"bplPct":null,"attendance":null},"51":{"stPct":0.0,"scPct":32.14,"rte":7,"teachers":2,"strength":27,"absentees":4.0,"bplPct":null,"attendance":null},"29":{"stPct":0.0,"scPct":46.4,"rte":7,"teachers":5,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"57":{"stPct":4.17,"scPct":58.33,"rte":8,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"56":{"stPct":0.0,"scPct":45.0,"rte":9,"teachers":2,"strength":14,"absentees":0.0,"bplPct":null,"attendance":null},"10":{"stPct":15.0,"scPct":8.33,"rte":9,"teachers":3,"strength":52,"absentees":11.0,"bplPct":null,"attendance":null},"30":{"stPct":3.09,"scPct":37.11,"rte":10,"teachers":5,"strength":104,"absentees":14.0,"bplPct":null,"attendance":null},"32":{"stPct":35.71,"scPct":14.29,"rte":7,"teachers":2,"strength":30,"absentees":5.0,"bplPct":null,"attendance":null},"33":{"stPct":6.45,"scPct":19.35,"rte":8,"teachers":2,"strength":24,"absentees":1.0,"bplPct":null,"attendance":null},"55":{"stPct":0.0,"scPct":61.54,"rte":8,"teachers":2,"strength":44,"absentees":6.0,"bplPct":null,"attendance":null},"44":{"stPct":82.52,"scPct":2.91,"rte":6,"teachers":5,"strength":98,"absentees":32.0,"bplPct":null,"attendance":null},"11":{"stPct":0.0,"scPct":32.0,"rte":6,"teachers":5,"strength":94,"absentees":18.0,"bplPct":null,"attendance":null},"45":{"stPct":13.08,"scPct":51.4,"rte":7,"teachers":5,"strength":104,"absentees":15.0,"bplPct":null,"attendance":null},"75":{"stPct":18.92,"scPct":12.61,"rte":9,"teachers":5,"strength":62,"absentees":18.0,"bplPct":null,"attendance":null},"74":{"stPct":0.0,"scPct":69.23,"rte":10,"teachers":2,"strength":27,"absentees":7.0,"bplPct":null,"attendance":null},"72":{"stPct":18.18,"scPct":4.55,"rte":9,"teachers":2,"strength":23,"absentees":5.0,"bplPct":null,"attendance":null},"43":{"stPct":0.49,"scPct":29.13,"rte":9,"teachers":8,"strength":141,"absentees":48.0,"bplPct":null,"attendance":null},"15":{"stPct":0.68,"scPct":22.45,"rte":7,"teachers":6,"strength":107,"absentees":17.0,"bplPct":null,"attendance":null},"14":{"stPct":0.0,"scPct":43.68,"rte":10,"teachers":3,"strength":77,"absentees":21.0,"bplPct":null,"attendance":null},"17":{"stPct":0.0,"scPct":18.87,"rte":10,"teachers":38,"strength":99,"absentees":0.0,"bplPct":null,"attendance":null},"68":{"stPct":18.3,"scPct":61.44,"rte":7,"teachers":7,"strength":119,"absentees":24.0,"bplPct":null,"attendance":null},"65":{"stPct":3.92,"scPct":0.0,"rte":5,"teachers":3,"strength":32,"absentees":3.0,"bplPct":null,"attendance":null},"66":{"stPct":0.0,"scPct":17.74,"rte":8,"teachers":3,"strength":45,"absentees":4.0,"bplPct":null,"attendance":null},"67":{"stPct":0.0,"scPct":0.0,"rte":8,"teachers":3,"strength":45,"absentees":6.0,"bplPct":null,"attendance":null},"12":{"stPct":0.0,"scPct":4.59,"rte":7,"teachers":9,"strength":228,"absentees":65.0,"bplPct":null,"attendance":null},"13":{"stPct":0.0,"scPct":6.52,"rte":8,"teachers":4,"strength":84,"absentees":3.0,"bplPct":null,"attendance":null},"49":{"stPct":0.0,"scPct":54.29,"rte":7,"teachers":5,"strength":62,"absentees":6.0,"bplPct":null,"attendance":null},"83":{"stPct":0.0,"scPct":55.14,"rte":7,"teachers":3,"strength":118,"absentees":15.0,"bplPct":null,"attendance":null},"82":{"stPct":0.0,"scPct":71.55,"rte":10,"teachers":6,"strength":70,"absentees":12.0,"bplPct":null,"attendance":null},"81":{"stPct":0.0,"scPct":57.63,"rte":9,"teachers":4,"strength":46,"absentees":17.0,"bplPct":null,"attendance":null}},"2019":{"1":{"stPct":31.0,"scPct":21.0,"rte":10,"teachers":4,"strength":67,"absentees":5.0,"bplPct":null,"attendance":null},"26":{"stPct":0.0,"scPct":82.26,"rte":7,"teachers":3,"strength":67,"absentees":6.0,"bplPct":null,"attendance":null},"64":{"stPct":2.0,"scPct":91.84,"rte":10,"teachers":2,"strength":38,"absentees":1.0,"bplPct":null,"attendance":null},"35":{"stPct":0.0,"scPct":85.71,"rte":8,"teachers":4,"strength":64,"absentees":2.0,"bplPct":null,"attendance":null},"63":{"stPct":51.02,"scPct":16.33,"rte":9,"teachers":3,"strength":53,"absentees":1.0,"bplPct":null,"attendance":null},"4":{"stPct":4.0,"scPct":72.0,"rte":9,"teachers":2,"strength":34,"absentees":6.0,"bplPct":null,"attendance":null},"25":{"stPct":0.0,"scPct":53.85,"rte":8,"teachers":2,"strength":14,"absentees":0.0,"bplPct":null,"attendance":null},"76":{"stPct":0.0,"scPct":50.0,"rte":10,"teachers":2,"strength":12,"absentees":0.0,"bplPct":null,"attendance":null},"2":{"stPct":11.02,"scPct":52.54,"rte":9,"teachers":4,"strength":123,"absentees":4.0,"bplPct":null,"attendance":null},"39":{"stPct":7.69,"scPct":64.62,"rte":10,"teachers":2,"strength":34,"absentees":2.0,"bplPct":null,"attendance":null},"40":{"stPct":1.05,"scPct":5.26,"rte":9,"teachers":3,"strength":67,"absentees":3.0,"bplPct":null,"attendance":null},"5":{"stPct":4.58,"scPct":61.83,"rte":9,"teachers":4,"strength":72,"absentees":5.0,"bplPct":null,"attendance":null},"37":{"stPct":28.0,"scPct":20.0,"rte":8,"teachers":2,"strength":23,"absentees":2.0,"bplPct":null,"attendance":null},"3":{"stPct":100.0,"scPct":0.0,"rte":7,"teachers":3,"strength":50,"absentees":0.0,"bplPct":null,"attendance":null},"20":{"stPct":0.0,"scPct":66.67,"rte":9,"teachers":2,"strength":37,"absentees":2.0,"bplPct":null,"attendance":null},"21":{"stPct":6.0,"scPct":38.0,"rte":10,"teachers":2,"strength":30,"absentees":1.0,"bplPct":null,"attendance":null},"22":{"stPct":0.0,"scPct":52.0,"rte":8,"teachers":2,"strength":25,"absentees":1.0,"bplPct":null,"attendance":null},"38":{"stPct":5.0,"scPct":37.0,"rte":10,"teachers":2,"strength":21,"absentees":1.0,"bplPct":null,"attendance":null},"23":{"stPct":2.0,"scPct":0.0,"rte":8,"teachers":2,"strength":40,"absentees":3.0,"bplPct":null,"attendance":null},"53":{"stPct":11.54,"scPct":23.08,"rte":10,"teachers":2,"strength":26,"absentees":2.0,"bplPct":null,"attendance":null},"28":{"stPct":31.82,"scPct":45.45,"rte":9,"teachers":2,"strength":25,"absentees":0.0,"bplPct":null,"attendance":null},"31":{"stPct":0.0,"scPct":22.22,"rte":8,"teachers":2,"strength":31,"absentees":1.0,"bplPct":null,"attendance":null},"34":{"stPct":50.0,"scPct":41.67,"rte":10,"teachers":2,"strength":35,"absentees":0.0,"bplPct":null,"attendance":null},"6":{"stPct":5.41,"scPct":5.41,"rte":10,"teachers":3,"strength":40,"absentees":1.0,"bplPct":null,"attendance":null},"36":{"stPct":9.09,"scPct":27.27,"rte":7,"teachers":2,"strength":24,"absentees":0.0,"bplPct":null,"attendance":null},"50":{"stPct":63.0,"scPct":13.0,"rte":10,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"54":{"stPct":22.5,"scPct":51.67,"rte":9,"teachers":4,"strength":75,"absentees":11.0,"bplPct":null,"attendance":null},"41":{"stPct":26.42,"scPct":37.74,"rte":9,"teachers":4,"strength":93,"absentees":6.0,"bplPct":null,"attendance":null},"42":{"stPct":10.53,"scPct":32.89,"rte":10,"teachers":2,"strength":40,"absentees":1.0,"bplPct":null,"attendance":null},"9":{"stPct":0.0,"scPct":75.36,"rte":9,"teachers":4,"strength":71,"absentees":4.0,"bplPct":null,"attendance":null},"8":{"stPct":0.0,"scPct":46.81,"rte":8,"teachers":3,"strength":42,"absentees":1.0,"bplPct":null,"attendance":null},"24":{"stPct":35.0,"scPct":40.0,"rte":10,"teachers":2,"strength":21,"absentees":1.0,"bplPct":null,"attendance":null},"7":{"stPct":28.17,"scPct":49.3,"rte":9,"teachers":4,"strength":80,"absentees":8.0,"bplPct":null,"attendance":null},"18":{"stPct":78.0,"scPct":0.0,"rte":10,"teachers":2,"strength":30,"absentees":1.0,"bplPct":null,"attendance":null},"60":{"stPct":0.0,"scPct":74.29,"rte":9,"teachers":2,"strength":28,"absentees":3.0,"bplPct":null,"attendance":null},"27":{"stPct":31.82,"scPct":0.0,"rte":10,"teachers":2,"strength":17,"absentees":3.0,"bplPct":null,"attendance":null},"51":{"stPct":0.0,"scPct":62.96,"rte":8,"teachers":2,"strength":33,"absentees":1.0,"bplPct":null,"attendance":null},"57":{"stPct":4.0,"scPct":56.0,"rte":9,"teachers":2,"strength":28,"absentees":0.0,"bplPct":null,"attendance":null},"56":{"stPct":0.0,"scPct":57.14,"rte":10,"teachers":2,"strength":13,"absentees":1.0,"bplPct":null,"attendance":null},"10":{"stPct":15.38,"scPct":11.54,"rte":9,"teachers":3,"strength":52,"absentees":8.0,"bplPct":null,"attendance":null},"30":{"stPct":2.91,"scPct":38.83,"rte":9,"teachers":5,"strength":97,"absentees":3.0,"bplPct":null,"attendance":null},"32":{"stPct":36.36,"scPct":54.55,"rte":8,"teachers":2,"strength":31,"absentees":2.0,"bplPct":null,"attendance":null},"33":{"stPct":8.33,"scPct":33.33,"rte":9,"teachers":2,"strength":29,"absentees":3.0,"bplPct":null,"attendance":null},"55":{"stPct":0.0,"scPct":69.05,"rte":7,"teachers":2,"strength":37,"absentees":1.0,"bplPct":null,"attendance":null},"78":{"stPct":13.68,"scPct":46.32,"rte":9,"teachers":3,"strength":53,"absentees":1.0,"bplPct":null,"attendance":null},"79":{"stPct":0.0,"scPct":70.0,"rte":7,"teachers":2,"strength":24,"absentees":3.0,"bplPct":null,"attendance":null},"77":{"stPct":20.0,"scPct":3.64,"rte":10,"teachers":3,"strength":48,"absentees":4.0,"bplPct":null,"attendance":null},"85":{"stPct":20.87,"scPct":1.74,"rte":9,"teachers":2,"strength":57,"absentees":6.0,"bplPct":null,"attendance":null},"86":{"stPct":0.0,"scPct":17.24,"rte":10,"teachers":2,"strength":26,"absentees":2.0,"bplPct":null,"attendance":null},"87":{"stPct":0.0,"scPct":0.0,"rte":10,"teachers":2,"strength":23,"absentees":1.0,"bplPct":null,"attendance":null},"58":{"stPct":6.67,"scPct":0.0,"rte":9,"teachers":2,"strength":22,"absentees":0.0,"bplPct":null,"attendance":null},"59":{"stPct":0.0,"scPct":100.0,"rte":9,"teachers":2,"strength":46,"absentees":0.0,"bplPct":null,"attendance":null},"61":{"stPct":0.0,"scPct":70.0,"rte":8,"teachers":2,"strength":20,"absentees":1.0,"bplPct":null,"attendance":null},"62":{"stPct":0.0,"scPct":71.74,"rte":8,"teachers":2,"strength":46,"absentees":3.0,"bplPct":null,"attendance":null},"91":{"stPct":1.36,"scPct":26.53,"rte":9,"teachers":3,"strength":86,"absentees":11.0,"bplPct":null,"attendance":null},"89":{"stPct":9.23,"scPct":66.15,"rte":9,"teachers":3,"strength":91,"absentees":12.0,"bplPct":null,"attendance":null},"90":{"stPct":66.67,"scPct":16.03,"rte":8,"teachers":6,"strength":155,"absentees":5.0,"bplPct":null,"attendance":null},"549":{"stPct":4.49,"scPct":42.7,"rte":9,"teachers":3,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"88":{"stPct":0.0,"scPct":38.55,"rte":8,"teachers":3,"strength":92,"absentees":5.0,"bplPct":null,"attendance":null},"92":{"stPct":15.66,"scPct":46.99,"rte":8,"teachers":2,"strength":55,"absentees":5.0,"bplPct":null,"attendance":null},"44":{"stPct":86.73,"scPct":2.04,"rte":6,"teachers":5,"strength":105,"absentees":8.0,"bplPct":null,"attendance":null},"11":{"stPct":2.0,"scPct":30.0,"rte":7,"teachers":5,"strength":103,"absentees":5.0,"bplPct":null,"attendance":null},"45":{"stPct":14.56,"scPct":49.51,"rte":8,"teachers":5,"strength":97,"absentees":6.0,"bplPct":null,"attendance":null},"491":{"stPct":24.66,"scPct":5.48,"rte":10,"teachers":4,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"489":{"stPct":1.04,"scPct":17.71,"rte":9,"teachers":4,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"75":{"stPct":22.22,"scPct":12.04,"rte":8,"teachers":2,"strength":57,"absentees":5.0,"bplPct":null,"attendance":null},"413":{"stPct":4.07,"scPct":20.33,"rte":10,"teachers":3,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"74":{"stPct":0.0,"scPct":57.69,"rte":9,"teachers":2,"strength":23,"absentees":2.0,"bplPct":null,"attendance":null},"70":{"stPct":4.4,"scPct":75.82,"rte":9,"teachers":2,"strength":59,"absentees":6.0,"bplPct":null,"attendance":null},"71":{"stPct":25.0,"scPct":75.0,"rte":9,"teachers":2,"strength":28,"absentees":4.0,"bplPct":null,"attendance":null},"72":{"stPct":4.35,"scPct":26.09,"rte":8,"teachers":2,"strength":36,"absentees":1.0,"bplPct":null,"attendance":null},"73":{"stPct":0.0,"scPct":100.0,"rte":9,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"43":{"stPct":0.6,"scPct":27.98,"rte":10,"teachers":5,"strength":137,"absentees":15.0,"bplPct":null,"attendance":null},"15":{"stPct":2.63,"scPct":26.32,"rte":9,"teachers":7,"strength":120,"absentees":6.0,"bplPct":null,"attendance":null},"14":{"stPct":0.0,"scPct":55.7,"rte":10,"teachers":3,"strength":71,"absentees":3.0,"bplPct":null,"attendance":null},"17":{"stPct":0.0,"scPct":21.11,"rte":10,"teachers":9,"strength":93,"absentees":66.0,"bplPct":null,"attendance":null},"68":{"stPct":16.52,"scPct":71.3,"rte":8,"teachers":7,"strength":135,"absentees":6.0,"bplPct":null,"attendance":null},"65":{"stPct":0.0,"scPct":0.0,"rte":6,"teachers":3,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"69":{"stPct":0.0,"scPct":62.19,"rte":9,"teachers":5,"strength":125,"absentees":6.0,"bplPct":null,"attendance":null},"66":{"stPct":0.0,"scPct":20.0,"rte":9,"teachers":3,"strength":31,"absentees":1.0,"bplPct":null,"attendance":null},"67":{"stPct":0.0,"scPct":3.0,"rte":7,"teachers":4,"strength":30,"absentees":0.0,"bplPct":null,"attendance":null},"12866":{"stPct":7.0,"scPct":58.0,"rte":10,"teachers":5,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"13951":{"stPct":11.0,"scPct":0.0,"rte":6,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"94":{"stPct":0.0,"scPct":51.85,"rte":9,"teachers":2,"strength":61,"absentees":0.0,"bplPct":null,"attendance":null},"95":{"stPct":11.0,"scPct":37.5,"rte":8,"teachers":3,"strength":84,"absentees":5.0,"bplPct":null,"attendance":null},"12":{"stPct":0.0,"scPct":3.15,"rte":8,"teachers":7,"strength":247,"absentees":18.0,"bplPct":null,"attendance":null},"13":{"stPct":0.0,"scPct":0.77,"rte":10,"teachers":4,"strength":82,"absentees":8.0,"bplPct":null,"attendance":null},"49":{"stPct":0.0,"scPct":52.29,"rte":8,"teachers":4,"strength":61,"absentees":5.0,"bplPct":null,"attendance":null},"83":{"stPct":0.0,"scPct":55.75,"rte":9,"teachers":4,"strength":122,"absentees":6.0,"bplPct":null,"attendance":null},"93":{"stPct":6.0,"scPct":30.11,"rte":8,"teachers":6,"strength":174,"absentees":13.0,"bplPct":null,"attendance":null},"96":{"stPct":0.0,"scPct":57.32,"rte":9,"teachers":4,"strength":48,"absentees":1.0,"bplPct":null,"attendance":null},"97":{"stPct":0.0,"scPct":100.0,"rte":10,"teachers":3,"strength":39,"absentees":2.0,"bplPct":null,"attendance":null},"82":{"stPct":0.0,"scPct":67.59,"rte":8,"teachers":4,"strength":67,"absentees":9.0,"bplPct":null,"attendance":null},"3929":{"stPct":0.0,"scPct":26.09,"rte":8,"teachers":2,"strength":29,"absentees":6.0,"bplPct":null,"attendance":null},"81":{"stPct":0.0,"scPct":76.12,"rte":9,"teachers":3,"strength":57,"absentees":6.0,"bplPct":null,"attendance":null},"113":{"stPct":5.68,"scPct":34.09,"rte":8,"teachers":4,"strength":102,"absentees":0.0,"bplPct":null,"attendance":null},"112":{"stPct":1.53,"scPct":35.89,"rte":8,"teachers":5,"strength":148,"absentees":0.0,"bplPct":null,"attendance":null},"114":{"stPct":10.13,"scPct":51.9,"rte":9,"teachers":2,"strength":52,"absentees":0.0,"bplPct":null,"attendance":null}},"2020":{"1":{"stPct":31.0,"scPct":21.0,"rte":10,"teachers":3,"strength":63,"absentees":1.0,"bplPct":null,"attendance":81.92},"26":{"stPct":0.0,"scPct":82.26,"rte":7,"teachers":4,"strength":74,"absentees":4.0,"bplPct":null,"attendance":88.51},"64":{"stPct":2.0,"scPct":91.84,"rte":10,"teachers":2,"strength":40,"absentees":0.0,"bplPct":null,"attendance":95.25},"35":{"stPct":0.0,"scPct":85.71,"rte":8,"teachers":3,"strength":65,"absentees":3.0,"bplPct":null,"attendance":83.36},"63":{"stPct":51.02,"scPct":16.33,"rte":9,"teachers":3,"strength":53,"absentees":4.0,"bplPct":null,"attendance":77.31},"4":{"stPct":4.0,"scPct":72.0,"rte":9,"teachers":2,"strength":19,"absentees":2.0,"bplPct":null,"attendance":71.26},"25":{"stPct":0.0,"scPct":53.85,"rte":8,"teachers":2,"strength":14,"absentees":0.0,"bplPct":null,"attendance":88.57},"76":{"stPct":0.0,"scPct":50.0,"rte":10,"teachers":2,"strength":10,"absentees":0.0,"bplPct":null,"attendance":100.0},"2":{"stPct":11.02,"scPct":52.54,"rte":9,"teachers":5,"strength":118,"absentees":5.0,"bplPct":null,"attendance":93.3},"39":{"stPct":7.69,"scPct":64.62,"rte":10,"teachers":2,"strength":27,"absentees":0.0,"bplPct":null,"attendance":83.7},"40":{"stPct":1.05,"scPct":5.26,"rte":9,"teachers":3,"strength":65,"absentees":3.0,"bplPct":null,"attendance":89.69},"5":{"stPct":4.58,"scPct":61.83,"rte":9,"teachers":4,"strength":76,"absentees":15.0,"bplPct":null,"attendance":83.22},"37":{"stPct":28.0,"scPct":20.0,"rte":8,"teachers":2,"strength":23,"absentees":0.0,"bplPct":null,"attendance":97.39},"3":{"stPct":100.0,"scPct":0.0,"rte":7,"teachers":3,"strength":46,"absentees":0.0,"bplPct":null,"attendance":90.12},"20":{"stPct":0.0,"scPct":66.67,"rte":9,"teachers":2,"strength":39,"absentees":0.0,"bplPct":null,"attendance":null},"21":{"stPct":6.0,"scPct":38.0,"rte":10,"teachers":2,"strength":25,"absentees":1.0,"bplPct":null,"attendance":90.44},"22":{"stPct":0.0,"scPct":52.0,"rte":8,"teachers":2,"strength":23,"absentees":0.0,"bplPct":null,"attendance":93.91},"38":{"stPct":5.0,"scPct":37.0,"rte":10,"teachers":2,"strength":19,"absentees":2.0,"bplPct":null,"attendance":93.68},"23":{"stPct":2.0,"scPct":0.0,"rte":8,"teachers":2,"strength":39,"absentees":6.0,"bplPct":null,"attendance":94.87},"53":{"stPct":11.54,"scPct":23.08,"rte":10,"teachers":2,"strength":30,"absentees":0.0,"bplPct":null,"attendance":87.33},"28":{"stPct":31.82,"scPct":45.45,"rte":9,"teachers":2,"strength":33,"absentees":1.0,"bplPct":null,"attendance":88.33},"31":{"stPct":0.0,"scPct":22.22,"rte":8,"teachers":2,"strength":23,"absentees":2.0,"bplPct":null,"attendance":94.35},"34":{"stPct":50.0,"scPct":41.67,"rte":10,"teachers":3,"strength":37,"absentees":8.0,"bplPct":null,"attendance":81.08},"6":{"stPct":5.41,"scPct":5.41,"rte":10,"teachers":3,"strength":44,"absentees":2.0,"bplPct":null,"attendance":94.09},"36":{"stPct":9.09,"scPct":27.27,"rte":7,"teachers":2,"strength":20,"absentees":1.0,"bplPct":null,"attendance":91.5},"50":{"stPct":63.0,"scPct":13.0,"rte":10,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"54":{"stPct":22.5,"scPct":51.67,"rte":9,"teachers":5,"strength":66,"absentees":12.0,"bplPct":null,"attendance":88.28},"41":{"stPct":26.42,"scPct":37.74,"rte":9,"teachers":5,"strength":90,"absentees":20.0,"bplPct":null,"attendance":84.0},"42":{"stPct":10.53,"scPct":32.89,"rte":10,"teachers":2,"strength":36,"absentees":1.0,"bplPct":null,"attendance":95.0},"9":{"stPct":0.0,"scPct":75.36,"rte":9,"teachers":3,"strength":75,"absentees":9.0,"bplPct":null,"attendance":93.84},"8":{"stPct":0.0,"scPct":46.81,"rte":8,"teachers":3,"strength":42,"absentees":2.0,"bplPct":null,"attendance":91.91},"24":{"stPct":35.0,"scPct":40.0,"rte":10,"teachers":2,"strength":19,"absentees":1.0,"bplPct":null,"attendance":93.16},"7":{"stPct":28.17,"scPct":49.3,"rte":9,"teachers":4,"strength":85,"absentees":5.0,"bplPct":null,"attendance":80.47},"18":{"stPct":78.0,"scPct":0.0,"rte":10,"teachers":2,"strength":32,"absentees":8.0,"bplPct":null,"attendance":70.63},"60":{"stPct":0.0,"scPct":74.29,"rte":9,"teachers":2,"strength":31,"absentees":3.0,"bplPct":null,"attendance":98.26},"27":{"stPct":31.82,"scPct":0.0,"rte":10,"teachers":2,"strength":17,"absentees":2.0,"bplPct":null,"attendance":84.71},"51":{"stPct":0.0,"scPct":62.96,"rte":8,"teachers":2,"strength":35,"absentees":1.0,"bplPct":null,"attendance":97.43},"57":{"stPct":4.0,"scPct":56.0,"rte":9,"teachers":2,"strength":25,"absentees":0.0,"bplPct":null,"attendance":94.44},"56":{"stPct":0.0,"scPct":57.14,"rte":10,"teachers":2,"strength":13,"absentees":0.0,"bplPct":null,"attendance":96.92},"10":{"stPct":15.38,"scPct":11.54,"rte":9,"teachers":3,"strength":52,"absentees":10.0,"bplPct":null,"attendance":95.98},"30":{"stPct":2.91,"scPct":38.83,"rte":9,"teachers":5,"strength":99,"absentees":11.0,"bplPct":null,"attendance":92.73},"32":{"stPct":36.36,"scPct":54.55,"rte":8,"teachers":3,"strength":29,"absentees":5.0,"bplPct":null,"attendance":77.59},"33":{"stPct":8.33,"scPct":33.33,"rte":9,"teachers":2,"strength":25,"absentees":1.0,"bplPct":null,"attendance":92.0},"55":{"stPct":0.0,"scPct":69.05,"rte":7,"teachers":2,"strength":26,"absentees":0.0,"bplPct":null,"attendance":88.85},"78":{"stPct":13.68,"scPct":46.32,"rte":9,"teachers":3,"strength":53,"absentees":1.0,"bplPct":null,"attendance":92.16},"79":{"stPct":0.0,"scPct":70.0,"rte":7,"teachers":2,"strength":22,"absentees":0.0,"bplPct":null,"attendance":92.73},"77":{"stPct":20.0,"scPct":3.64,"rte":10,"teachers":2,"strength":45,"absentees":6.0,"bplPct":null,"attendance":82.22},"85":{"stPct":20.87,"scPct":1.74,"rte":9,"teachers":2,"strength":61,"absentees":5.0,"bplPct":null,"attendance":82.33},"86":{"stPct":0.0,"scPct":17.24,"rte":10,"teachers":2,"strength":14,"absentees":1.0,"bplPct":null,"attendance":92.86},"87":{"stPct":0.0,"scPct":0.0,"rte":10,"teachers":2,"strength":31,"absentees":0.0,"bplPct":null,"attendance":93.87},"58":{"stPct":6.67,"scPct":0.0,"rte":9,"teachers":2,"strength":21,"absentees":0.0,"bplPct":null,"attendance":94.74},"59":{"stPct":0.0,"scPct":100.0,"rte":9,"teachers":2,"strength":41,"absentees":6.0,"bplPct":null,"attendance":91.33},"61":{"stPct":0.0,"scPct":70.0,"rte":8,"teachers":2,"strength":22,"absentees":1.0,"bplPct":null,"attendance":91.49},"62":{"stPct":0.0,"scPct":71.74,"rte":8,"teachers":2,"strength":45,"absentees":0.0,"bplPct":null,"attendance":90.44},"91":{"stPct":1.36,"scPct":26.53,"rte":9,"teachers":3,"strength":80,"absentees":12.0,"bplPct":null,"attendance":80.75},"89":{"stPct":9.23,"scPct":66.15,"rte":9,"teachers":2,"strength":63,"absentees":8.0,"bplPct":null,"attendance":72.06},"90":{"stPct":66.67,"scPct":16.03,"rte":8,"teachers":6,"strength":153,"absentees":31.0,"bplPct":null,"attendance":76.87},"549":{"stPct":4.49,"scPct":42.7,"rte":9,"teachers":3,"strength":55,"absentees":5.0,"bplPct":null,"attendance":91.45},"88":{"stPct":0.0,"scPct":38.55,"rte":8,"teachers":4,"strength":101,"absentees":9.0,"bplPct":null,"attendance":91.88},"92":{"stPct":15.66,"scPct":46.99,"rte":8,"teachers":3,"strength":51,"absentees":0.0,"bplPct":null,"attendance":86.27},"44":{"stPct":86.73,"scPct":2.04,"rte":6,"teachers":5,"strength":96,"absentees":29.0,"bplPct":null,"attendance":42.32},"11":{"stPct":2.0,"scPct":30.0,"rte":7,"teachers":5,"strength":103,"absentees":9.0,"bplPct":null,"attendance":86.89},"45":{"stPct":14.56,"scPct":49.51,"rte":8,"teachers":5,"strength":87,"absentees":15.0,"bplPct":null,"attendance":81.49},"491":{"stPct":24.66,"scPct":5.48,"rte":10,"teachers":4,"strength":78,"absentees":16.0,"bplPct":null,"attendance":91.92},"489":{"stPct":1.04,"scPct":17.71,"rte":9,"teachers":5,"strength":109,"absentees":6.0,"bplPct":null,"attendance":87.41},"75":{"stPct":22.22,"scPct":12.04,"rte":8,"teachers":2,"strength":63,"absentees":6.0,"bplPct":null,"attendance":83.49},"413":{"stPct":4.07,"scPct":20.33,"rte":10,"teachers":3,"strength":78,"absentees":8.0,"bplPct":null,"attendance":96.25},"74":{"stPct":0.0,"scPct":57.69,"rte":9,"teachers":2,"strength":23,"absentees":5.0,"bplPct":null,"attendance":93.04},"71":{"stPct":25.0,"scPct":75.0,"rte":9,"teachers":2,"strength":23,"absentees":3.0,"bplPct":null,"attendance":82.61},"72":{"stPct":4.35,"scPct":26.09,"rte":8,"teachers":2,"strength":38,"absentees":6.0,"bplPct":null,"attendance":93.12},"43":{"stPct":0.6,"scPct":27.98,"rte":10,"teachers":5,"strength":173,"absentees":0.0,"bplPct":null,"attendance":null},"15":{"stPct":2.63,"scPct":26.32,"rte":9,"teachers":6,"strength":117,"absentees":18.0,"bplPct":null,"attendance":76.85},"14":{"stPct":0.0,"scPct":55.7,"rte":10,"teachers":4,"strength":60,"absentees":5.0,"bplPct":null,"attendance":87.56},"17":{"stPct":0.0,"scPct":21.11,"rte":10,"teachers":8,"strength":96,"absentees":96.0,"bplPct":null,"attendance":null},"68":{"stPct":16.52,"scPct":71.3,"rte":8,"teachers":7,"strength":149,"absentees":16.0,"bplPct":null,"attendance":88.99},"65":{"stPct":0.0,"scPct":0.0,"rte":6,"teachers":2,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"69":{"stPct":0.0,"scPct":62.19,"rte":9,"teachers":5,"strength":129,"absentees":10.0,"bplPct":null,"attendance":91.19},"66":{"stPct":0.0,"scPct":20.0,"rte":9,"teachers":2,"strength":37,"absentees":1.0,"bplPct":null,"attendance":95.68},"67":{"stPct":0.0,"scPct":3.0,"rte":7,"teachers":2,"strength":25,"absentees":2.0,"bplPct":null,"attendance":94.2},"12866":{"stPct":7.0,"scPct":58.0,"rte":10,"teachers":7,"strength":146,"absentees":15.0,"bplPct":null,"attendance":94.45},"13951":{"stPct":11.0,"scPct":0.0,"rte":6,"teachers":4,"strength":106,"absentees":2.0,"bplPct":null,"attendance":94.99},"94":{"stPct":0.0,"scPct":51.85,"rte":9,"teachers":3,"strength":57,"absentees":2.0,"bplPct":null,"attendance":94.62},"95":{"stPct":11.0,"scPct":37.5,"rte":8,"teachers":4,"strength":89,"absentees":8.0,"bplPct":null,"attendance":90.0},"12":{"stPct":0.0,"scPct":3.15,"rte":8,"teachers":7,"strength":null,"absentees":null,"bplPct":null,"attendance":null},"13":{"stPct":0.0,"scPct":0.77,"rte":10,"teachers":4,"strength":85,"absentees":4.0,"bplPct":null,"attendance":96.21},"49":{"stPct":0.0,"scPct":52.29,"rte":8,"teachers":4,"strength":63,"absentees":10.0,"bplPct":null,"attendance":92.19},"83":{"stPct":0.0,"scPct":55.75,"rte":9,"teachers":6,"strength":121,"absentees":29.0,"bplPct":null,"attendance":91.79},"93":{"stPct":6.0,"scPct":30.11,"rte":8,"teachers":7,"strength":172,"absentees":38.0,"bplPct":null,"attendance":75.52},"96":{"stPct":0.0,"scPct":57.32,"rte":9,"teachers":4,"strength":45,"absentees":3.0,"bplPct":null,"attendance":89.5},"97":{"stPct":0.0,"scPct":100.0,"rte":10,"teachers":2,"strength":42,"absentees":2.0,"bplPct":null,"attendance":90.24},"82":{"stPct":0.0,"scPct":67.59,"rte":8,"teachers":6,"strength":72,"absentees":12.0,"bplPct":null,"attendance":81.41},"3929":{"stPct":0.0,"scPct":26.09,"rte":8,"teachers":2,"strength":35,"absentees":11.0,"bplPct":null,"attendance":78.4},"81":{"stPct":0.0,"scPct":76.12,"rte":9,"teachers":4,"strength":58,"absentees":10.0,"bplPct":null,"attendance":85.21},"113":{"stPct":5.68,"scPct":34.09,"rte":8,"teachers":6,"strength":123,"absentees":38.0,"bplPct":null,"attendance":71.04},"112":{"stPct":1.53,"scPct":35.89,"rte":8,"teachers":5,"strength":159,"absentees":20.0,"bplPct":null,"attendance":85.1},"114":{"stPct":10.13,"scPct":51.9,"rte":9,"teachers":2,"strength":62,"absentees":13.0,"bplPct":null,"attendance":84.59},"5193":{"stPct":0.0,"scPct":34.08,"rte":7,"teachers":6,"strength":206,"absentees":48.0,"bplPct":null,"attendance":86.37},"16":{"stPct":0.93,"scPct":26.17,"rte":8,"teachers":5,"strength":107,"absentees":0.0,"bplPct":null,"attendance":82.65}},"2022":{"1":{"stPct":25.0,"scPct":18.0,"rte":null,"teachers":4,"strength":71,"absentees":9.0,"bplPct":17.0,"attendance":84.6},"26":{"stPct":0.0,"scPct":76.0,"rte":null,"teachers":4,"strength":102,"absentees":10.0,"bplPct":4.0,"attendance":85.0},"64":{"stPct":0.0,"scPct":100.0,"rte":null,"teachers":2,"strength":47,"absentees":3.0,"bplPct":18.0,"attendance":87.02},"35":{"stPct":3.0,"scPct":84.0,"rte":null,"teachers":3,"strength":86,"absentees":15.0,"bplPct":34.0,"attendance":81.63},"63":{"stPct":39.0,"scPct":33.0,"rte":null,"teachers":3,"strength":62,"absentees":13.0,"bplPct":13.0,"attendance":84.84},"4":{"stPct":0.0,"scPct":76.0,"rte":null,"teachers":2,"strength":12,"absentees":0.0,"bplPct":76.0,"attendance":89.42},"25":{"stPct":0.0,"scPct":50.0,"rte":null,"teachers":2,"strength":19,"absentees":3.0,"bplPct":40.0,"attendance":94.94},"76":{"stPct":0.0,"scPct":61.0,"rte":null,"teachers":2,"strength":null,"absentees":null,"bplPct":92.0,"attendance":null},"2":{"stPct":11.0,"scPct":50.0,"rte":null,"teachers":5,"strength":123,"absentees":19.0,"bplPct":64.0,"attendance":85.5},"39":{"stPct":9.0,"scPct":57.0,"rte":null,"teachers":2,"strength":36,"absentees":8.0,"bplPct":49.0,"attendance":89.03},"40":{"stPct":3.0,"scPct":5.0,"rte":null,"teachers":3,"strength":58,"absentees":5.0,"bplPct":12.0,"attendance":83.26},"5":{"stPct":6.0,"scPct":64.0,"rte":null,"teachers":4,"strength":97,"absentees":12.0,"bplPct":8.0,"attendance":91.09},"37":{"stPct":33.0,"scPct":19.0,"rte":null,"teachers":2,"strength":25,"absentees":3.0,"bplPct":62.0,"attendance":89.56},"3":{"stPct":100.0,"scPct":0.0,"rte":null,"teachers":2,"strength":37,"absentees":10.0,"bplPct":40.0,"attendance":22.78},"20":{"stPct":0.0,"scPct":66.0,"rte":null,"teachers":2,"strength":34,"absentees":8.0,"bplPct":45.0,"attendance":92.03},"21":{"stPct":5.0,"scPct":32.0,"rte":null,"teachers":1,"strength":null,"absentees":null,"bplPct":11.0,"attendance":null},"22":{"stPct":4.0,"scPct":38.0,"rte":null,"teachers":2,"strength":34,"absentees":4.0,"bplPct":23.0,"attendance":82.26},"38":{"stPct":0.0,"scPct":50.0,"rte":null,"teachers":2,"strength":23,"absentees":1.0,"bplPct":29.0,"attendance":93.31},"23":{"stPct":0.0,"scPct":3.0,"rte":null,"teachers":2,"strength":33,"absentees":7.0,"bplPct":100.0,"attendance":77.47},"53":{"stPct":32.0,"scPct":10.0,"rte":null,"teachers":2,"strength":34,"absentees":8.0,"bplPct":26.0,"attendance":84.0},"28":{"stPct":21.0,"scPct":48.0,"rte":null,"teachers":2,"strength":44,"absentees":7.0,"bplPct":0.0,"attendance":null},"31":{"stPct":0.0,"scPct":15.0,"rte":null,"teachers":2,"strength":null,"absentees":null,"bplPct":23.0,"attendance":null},"34":{"stPct":54.0,"scPct":26.0,"rte":null,"teachers":2,"strength":40,"absentees":6.0,"bplPct":56.0,"attendance":80.08},"6":{"stPct":2.0,"scPct":0.0,"rte":null,"teachers":2,"strength":83,"absentees":4.0,"bplPct":7.0,"attendance":92.55},"36":{"stPct":0.0,"scPct":6.0,"rte":null,"teachers":1,"strength":19,"absentees":3.0,"bplPct":6.0,"attendance":92.72},"54":{"stPct":23.0,"scPct":53.0,"rte":null,"teachers":8,"strength":47,"absentees":15.0,"bplPct":80.0,"attendance":null},"41":{"stPct":19.0,"scPct":38.0,"rte":null,"teachers":3,"strength":79,"absentees":23.0,"bplPct":48.0,"attendance":78.58},"42":{"stPct":11.0,"scPct":45.0,"rte":null,"teachers":2,"strength":null,"absentees":null,"bplPct":23.0,"attendance":null},"9":{"stPct":0.0,"scPct":62.0,"rte":null,"teachers":2,"strength":102,"absentees":18.0,"bplPct":55.0,"attendance":91.19},"8":{"stPct":0.0,"scPct":53.0,"rte":null,"teachers":3,"strength":53,"absentees":3.0,"bplPct":24.0,"attendance":87.08},"24":{"stPct":36.0,"scPct":27.0,"rte":null,"teachers":1,"strength":29,"absentees":5.0,"bplPct":68.0,"attendance":81.03},"7":{"stPct":27.0,"scPct":48.0,"rte":null,"teachers":3,"strength":97,"absentees":28.0,"bplPct":73.0,"attendance":83.36},"18":{"stPct":73.0,"scPct":0.0,"rte":null,"teachers":2,"strength":37,"absentees":10.0,"bplPct":97.0,"attendance":79.83},"60":{"stPct":8.0,"scPct":56.0,"rte":null,"teachers":2,"strength":null,"absentees":null,"bplPct":17.0,"attendance":null},"27":{"stPct":7.0,"scPct":0.0,"rte":null,"teachers":2,"strength":22,"absentees":6.0,"bplPct":7.0,"attendance":83.05},"51":{"stPct":0.0,"scPct":59.0,"rte":null,"teachers":2,"strength":37,"absentees":5.0,"bplPct":41.0,"attendance":95.92},"57":{"stPct":0.0,"scPct":56.0,"rte":null,"teachers":2,"strength":35,"absentees":5.0,"bplPct":33.0,"attendance":94.15},"30":{"stPct":4.0,"scPct":39.0,"rte":null,"teachers":4,"strength":null,"absentees":null,"bplPct":39.0,"attendance":null},"32":{"stPct":50.0,"scPct":29.0,"rte":null,"teachers":2,"strength":null,"absentees":null,"bplPct":64.0,"attendance":82.5},"33":{"stPct":8.0,"scPct":12.0,"rte":null,"teachers":2,"strength":50,"absentees":10.0,"bplPct":38.0,"attendance":null},"55":{"stPct":12.0,"scPct":58.0,"rte":null,"teachers":2,"strength":32,"absentees":9.0,"bplPct":54.0,"attendance":74.44},"78":{"stPct":14.0,"scPct":64.0,"rte":null,"teachers":2,"strength":59,"absentees":6.0,"bplPct":85.0,"attendance":89.77},"77":{"stPct":15.0,"scPct":1.0,"rte":null,"teachers":2,"strength":74,"absentees":6.0,"bplPct":75.0,"attendance":91.16},"85":{"stPct":19.0,"scPct":3.0,"rte":null,"teachers":2,"strength":68,"absentees":29.0,"bplPct":40.0,"attendance":85.56},"86":{"stPct":0.0,"scPct":8.0,"rte":null,"teachers":2,"strength":16,"absentees":4.0,"bplPct":77.0,"attendance":96.88},"87":{"stPct":0.0,"scPct":15.0,"rte":null,"teachers":2,"strength":39,"absentees":9.0,"bplPct":29.0,"attendance":91.01},"58":{"stPct":16.0,"scPct":0.0,"rte":null,"teachers":2,"strength":null,"absentees":null,"bplPct":16.0,"attendance":null},"59":{"stPct":0.0,"scPct":100.0,"rte":null,"teachers":2,"strength":40,"absentees":3.0,"bplPct":33.0,"attendance":94.42},"61":{"stPct":78.0,"scPct":0.0,"rte":null,"teachers":2,"strength":25,"absentees":0.0,"bplPct":5.0,"attendance":98.32},"62":{"stPct":0.0,"scPct":66.0,"rte":null,"teachers":2,"strength":40,"absentees":2.0,"bplPct":49.0,"attendance":96.4},"91":{"stPct":1.0,"scPct":24.0,"rte":null,"teachers":3,"strength":82,"absentees":14.0,"bplPct":41.0,"attendance":null},"89":{"stPct":2.0,"scPct":68.0,"rte":null,"teachers":4,"strength":86,"absentees":21.0,"bplPct":18.0,"attendance":86.05},"90":{"stPct":60.0,"scPct":21.0,"rte":null,"teachers":6,"strength":191,"absentees":70.0,"bplPct":82.0,"attendance":null},"549":{"stPct":2.0,"scPct":37.0,"rte":null,"teachers":2,"strength":83,"absentees":19.0,"bplPct":54.0,"attendance":90.0},"88":{"stPct":0.0,"scPct":18.0,"rte":null,"teachers":3,"strength":105,"absentees":9.0,"bplPct":49.0,"attendance":null},"92":{"stPct":25.0,"scPct":42.0,"rte":null,"teachers":3,"strength":55,"absentees":14.0,"bplPct":33.0,"attendance":83.04},"2251":{"stPct":15.0,"scPct":22.0,"rte":null,"teachers":6,"strength":150,"absentees":28.0,"bplPct":43.0,"attendance":76.36},"44":{"stPct":96.0,"scPct":3.0,"rte":null,"teachers":6,"strength":116,"absentees":56.0,"bplPct":83.0,"attendance":null},"11":{"stPct":0.0,"scPct":36.0,"rte":null,"teachers":5,"strength":124,"absentees":22.0,"bplPct":31.0,"attendance":null},"45":{"stPct":5.0,"scPct":53.0,"rte":null,"teachers":5,"strength":130,"absentees":26.0,"bplPct":18.0,"attendance":85.07},"491":{"stPct":22.0,"scPct":1.0,"rte":null,"teachers":4,"strength":82,"absentees":14.0,"bplPct":88.0,"attendance":78.13},"489":{"stPct":1.0,"scPct":27.0,"rte":null,"teachers":4,"strength":144,"absentees":15.0,"bplPct":65.0,"attendance":86.62},"413":{"stPct":1.0,"scPct":29.0,"rte":null,"teachers":3,"strength":85,"absentees":6.0,"bplPct":15.0,"attendance":91.43},"68":{"stPct":6.0,"scPct":76.0,"rte":null,"teachers":6,"strength":174,"absentees":20.0,"bplPct":57.0,"attendance":80.41},"69":{"stPct":0.0,"scPct":55.0,"rte":null,"teachers":5,"strength":152,"absentees":21.0,"bplPct":3.0,"attendance":82.37},"66":{"stPct":0.0,"scPct":7.0,"rte":null,"teachers":2,"strength":51,"absentees":2.0,"bplPct":95.0,"attendance":92.86},"67":{"stPct":0.0,"scPct":8.0,"rte":null,"teachers":2,"strength":33,"absentees":5.0,"bplPct":65.0,"attendance":86.42},"12866":{"stPct":9.0,"scPct":58.0,"rte":null,"teachers":6,"strength":159,"absentees":26.0,"bplPct":80.0,"attendance":87.79},"13951":{"stPct":6.0,"scPct":0.0,"rte":null,"teachers":4,"strength":133,"absentees":13.0,"bplPct":86.0,"attendance":90.26},"94":{"stPct":0.0,"scPct":32.0,"rte":null,"teachers":3,"strength":68,"absentees":7.0,"bplPct":41.0,"attendance":88.68},"95":{"stPct":8.0,"scPct":33.0,"rte":null,"teachers":4,"strength":112,"absentees":10.0,"bplPct":77.0,"attendance":87.89},"93":{"stPct":6.0,"scPct":32.0,"rte":null,"teachers":7,"strength":236,"absentees":40.0,"bplPct":46.0,"attendance":68.84},"12":{"stPct":0.0,"scPct":1.0,"rte":null,"teachers":8,"strength":null,"absentees":null,"bplPct":15.0,"attendance":null},"13":{"stPct":0.0,"scPct":1.0,"rte":null,"teachers":4,"strength":73,"absentees":9.0,"bplPct":4.0,"attendance":84.41},"83":{"stPct":0.0,"scPct":60.0,"rte":null,"teachers":5,"strength":127,"absentees":11.0,"bplPct":4.0,"attendance":85.74},"96":{"stPct":0.0,"scPct":93.0,"rte":null,"teachers":3,"strength":30,"absentees":0.0,"bplPct":8.0,"attendance":73.28},"97":{"stPct":0.0,"scPct":97.0,"rte":null,"teachers":2,"strength":51,"absentees":2.0,"bplPct":13.0,"attendance":89.12},"14":{"stPct":0.0,"scPct":50.0,"rte":null,"teachers":4,"strength":77,"absentees":13.0,"bplPct":35.0,"attendance":null},"82":{"stPct":0.0,"scPct":60.0,"rte":null,"teachers":5,"strength":118,"absentees":15.0,"bplPct":35.0,"attendance":79.07},"3929":{"stPct":0.0,"scPct":52.0,"rte":null,"teachers":3,"strength":72,"absentees":18.0,"bplPct":57.0,"attendance":83.83},"81":{"stPct":0.0,"scPct":65.0,"rte":null,"teachers":2,"strength":89,"absentees":25.0,"bplPct":27.0,"attendance":null},"113":{"stPct":19.0,"scPct":25.0,"rte":null,"teachers":6,"strength":253,"absentees":74.0,"bplPct":46.0,"attendance":71.66},"5193":{"stPct":1.0,"scPct":34.0,"rte":null,"teachers":7,"strength":456,"absentees":92.0,"bplPct":18.0,"attendance":66.54},"16":{"stPct":4.0,"scPct":23.0,"rte":null,"teachers":5,"strength":205,"absentees":51.0,"bplPct":65.0,"attendance":null},"48":{"stPct":0.0,"scPct":38.0,"rte":null,"teachers":6,"strength":14,"absentees":0.0,"bplPct":87.0,"attendance":null}}};

const SUBJECT_COLOR = {
  Maths: "#FBBF24",
  English: "#5EEAD4",
  Tamil: "#A78BFA",
  "Social Science": "#34D399",
  Science: "#FB7185",
  "Computer Science": "#60A5FA",
  EVS: "#F472B6",
};
function subjectColor(s) {
  return SUBJECT_COLOR[s] || "#93A0BE";
}

function accuracyColor(pct) {
  if (pct < 35) return "#FB7185";
  if (pct < 55) return "#FBBF24";
  return "#34D399";
}

const TABS = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "school-averages", label: "School Averages", icon: Table2 },
  { id: "assessment-analysis", label: "Assessment Analysis", icon: LineChartIcon },
  { id: "influences", label: "What Influences Scores", icon: Layers },
  { id: "engagement", label: "Content Engagement", icon: Smartphone },
];

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={accent ? { background: accent } : undefined}>
        <Icon size={18} />
      </div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, note }) {
  return (
    <div className="section-header">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {note && <p className="section-note">{note}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload, label, suffix }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: p.color || p.fill }} />
          <span>{p.name}: <strong>{p.value}{suffix || ""}</strong></span>
        </div>
      ))}
    </div>
  );
}

function OverviewTab() {
  const k = DATA.kpis;
  const classesBySubject = useMemo(() => {
    const map = {};
    DATA.performanceBySubjectClass.forEach((r) => {
      map[r.class] = map[r.class] || { class: `Class ${r.class}` };
      map[r.class][r.subject] = r.avgPct;
    });
    return Object.values(map).sort((a, b) => a.class.localeCompare(b.class, undefined, { numeric: true }));
  }, []);
  const subjects = [...new Set(DATA.performanceBySubjectClass.map((r) => r.subject))];

  return (
    <>
      <div className="kpi-grid">
        <KpiCard icon={School} label="Schools assessed" value={k.totalSchools.toLocaleString()} />
        <KpiCard icon={Users} label="Students assessed" value={k.totalStudentsAssessed.toLocaleString()} />
        <KpiCard icon={Target} label="Average score" value={`${k.avgScorePct}%`} accent="#F2A93B" />
        <KpiCard icon={GraduationCap} label="Participation rate" value={`${k.participationRate}%`} sub="of enrolled students scored" />
        <KpiCard icon={TrendingUp} label="Years of data" value={`${k.yearRange[0]}–${k.yearRange[1]}`} />
        <KpiCard icon={Smartphone} label="Schools using the app" value={k.usageSchools.toLocaleString()} sub="in this usage sample" />
      </div>

      <SectionHeader
        eyebrow="Quick read"
        title="Average score by subject and class"
        note="Every score is normalized to a percentage of that paper's maximum marks, so subjects and classes are comparable side by side."
      />
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classesBySubject} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
            <XAxis dataKey="class" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip suffix="%" />} cursor={{ fill: "rgba(94,234,212,0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {subjects.map((s) => (
              <Bar key={s} dataKey={s} fill={subjectColor(s)} radius={[6, 6, 0, 0]} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="callout">
        <Info size={16} />
        <p>
          This dashboard reads a sample export from the assessment portal (database name:
          <code> samplekanini</code>) — treat exact figures as illustrative of what the full
          dataset would show, not final production numbers. Usage-activity data covers a
          {" "}{k.usageDateRange[0].slice(0, 10)} to {k.usageDateRange[1].slice(0, 10)} window in this sample.
        </p>
      </div>
    </>
  );
}

function PerformanceTab() {
  const classesBySubject = useMemo(() => {
    const map = {};
    DATA.performanceBySubjectClass.forEach((r) => {
      map[r.class] = map[r.class] || { class: `Class ${r.class}` };
      map[r.class][r.subject] = r.avgPct;
    });
    return Object.values(map).sort((a, b) => a.class.localeCompare(b.class, undefined, { numeric: true }));
  }, []);
  const subjects = [...new Set(DATA.performanceBySubjectClass.map((r) => r.subject))];

  const yearsBySubject = useMemo(() => {
    const map = {};
    DATA.trendsBySubjectYear.forEach((r) => {
      map[r.year] = map[r.year] || { year: r.year };
      map[r.year][r.subject] = r.avgPct;
    });
    return Object.values(map).sort((a, b) => a.year - b.year);
  }, []);

  const weakest = DATA.topicAccuracy.slice(0, 10);
  const strongest = [...DATA.topicAccuracy].slice(-6).reverse();

  return (
    <>
      <SectionHeader
        eyebrow="Subject × Class"
        title="Where scores are highest and lowest"
        note="Grouped by class, one bar per subject — a fast way to spot which class/subject combinations need attention."
      />
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={classesBySubject} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
            <XAxis dataKey="class" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip suffix="%" />} cursor={{ fill: "rgba(94,234,212,0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {subjects.map((s) => (
              <Bar key={s} dataKey={s} fill={subjectColor(s)} radius={[6, 6, 0, 0]} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader
        eyebrow="Over time"
        title="Score trends across years"
        note="Sparse years reflect how much of that year is present in this sample export, not necessarily low real performance."
      />
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={yearsBySubject} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip suffix="%" />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {["Maths", "English"].map((s) => (
              <Line key={s} type="monotone" dataKey={s} stroke={subjectColor(s)} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader
        eyebrow="Topic / slice analysis"
        title="Which topics students struggle with most"
        note={`Accuracy = correct answers among attempted questions, for topics with 30+ attempts in this sample.`}
      />
      <div className="two-col">
        <div className="chart-card">
          <h3 className="mini-title"><ArrowDownRight size={15} color="#E4572E" /> Needs the most attention</h3>
          {weakest.map((t) => (
            <div className="topic-bar-row" key={t.topic}>
              <div className="topic-bar-label">
                <span>{t.topic}</span>
                <span className="topic-subject-chip" style={{ color: subjectColor(t.subject) }}>{t.subject}</span>
              </div>
              <div className="topic-bar-track">
                <div className="topic-bar-fill" style={{ width: `${t.accuracyPct}%`, background: accuracyColor(t.accuracyPct) }} />
              </div>
              <span className="topic-bar-pct">{t.accuracyPct}%</span>
            </div>
          ))}
        </div>
        <div className="chart-card">
          <h3 className="mini-title"><ArrowUpRight size={15} color="#5B8C5A" /> Strongest topics</h3>
          {strongest.map((t) => (
            <div className="topic-bar-row" key={t.topic}>
              <div className="topic-bar-label">
                <span>{t.topic}</span>
                <span className="topic-subject-chip" style={{ color: subjectColor(t.subject) }}>{t.subject}</span>
              </div>
              <div className="topic-bar-track">
                <div className="topic-bar-fill" style={{ width: `${t.accuracyPct}%`, background: accuracyColor(t.accuracyPct) }} />
              </div>
              <span className="topic-bar-pct">{t.accuracyPct}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ComparisonBars({ data, valueKey = "avgPct", labelKey = "label", colorFn }) {
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div className="compare-bars">
      {data.map((d, i) => (
        <div className="compare-row" key={d[labelKey]}>
          <span className="compare-label">{d[labelKey]}</span>
          <div className="compare-track">
            <div
              className="compare-fill"
              style={{
                width: `${(d[valueKey] / max) * 100}%`,
                background: colorFn ? colorFn(d, i) : "#3E8FB0",
              }}
            />
          </div>
          <span className="compare-value">{d[valueKey]}%</span>
          <span className="compare-n">n={d.n.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function Pills({ options, value, onChange }) {
  return (
    <div className="pill-row">
      {options.map((o) => (
        <button
          key={o.value}
          className={"pill" + (value === o.value ? " pill-active" : "")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function cellColor(pct) {
  if (pct == null) return "transparent";
  if (pct < 35) return "rgba(251,113,133,0.22)";
  if (pct >= 60) return "rgba(52,211,153,0.22)";
  return "transparent";
}

function YearSelect({ year, onChange }) {
  return (
    <select className="year-select" value={year} onChange={(e) => onChange(+e.target.value)}>
      {REAL_DATA.years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}

function SchoolAveragesTab() {
  const [year, setYear] = useState(2018);
  const [mode, setMode] = useState("regular");
  const [oralSubject, setOralSubject] = useState("English");
  const [rankView, setRankView] = useState("top");
  const yd = REAL_DATA.byYear[year];
  const sa = yd.schoolAverages;
  const cs = REAL_DATA.csSchoolAverages;
  const oralRows = yd.oralStatus[oralSubject];

  const ranking = useMemo(() => {
    const profileYear = SCHOOL_PROFILE[year] || {};
    const rows = sa.schools.map((row) => {
      let sumPct = 0, sumWeight = 0, cells = 0;
      Object.values(row.cells).forEach((cell) => {
        if (cell.avg != null && cell.max) {
          const pct = (100 * cell.avg) / cell.max;
          const weight = cell.attempted || 1;
          sumPct += pct * weight;
          sumWeight += weight;
          cells += 1;
        }
      });
      return sumWeight > 0
        ? { schoolId: row.schoolId, avgPct: Math.round((sumPct / sumWeight) * 10) / 10, cells, students: sumWeight, profile: profileYear[row.schoolId] || null }
        : null;
    }).filter((r) => r && r.cells >= 2);
    return rows.sort((a, b) => b.avgPct - a.avgPct);
  }, [sa, year]);
  const rankedShown = rankView === "top" ? ranking.slice(0, 10) : [...ranking].reverse().slice(0, 10);

  const rteScatter = useMemo(
    () => ranking.filter((r) => r.profile && r.profile.rte != null).map((r) => ({ x: r.profile.rte, y: r.avgPct, schoolId: r.schoolId })),
    [ranking]
  );

  return (
    <>
      <SectionHeader
        eyebrow="AAA"
        title="School-wise average scores"
        note="Each cell shows the average marks scored, plus students assessed / enrolled in that class. Combines the site's School Average Score and CS School Average Score views — switch tabs below."
      />
      <div className="pill-row">
        <span className="year-label">Year:</span>
        <YearSelect year={year} onChange={setYear} />
      </div>
      <Pills
        options={[
          { value: "regular", label: "All Schools (English/Maths)" },
          { value: "cs", label: "CS Results" },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === "regular" && (
        sa.schools.length === 0 ? (
          <div className="callout"><Info size={16} /><span>No written assessment records for {year} in this sample.</span></div>
        ) : (
        <div className="chart-card table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sticky-col">School</th>
                {sa.classSubjectCols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sa.schools.map((row) => (
                <tr key={row.schoolId}>
                  <td className="sticky-col school-cell">School #{row.schoolId}</td>
                  {sa.classSubjectCols.map((c) => {
                    const cell = row.cells[c];
                    if (!cell || cell.avg == null) {
                      return <td key={c} className="dim-cell">nil</td>;
                    }
                    const pct = cell.max ? (100 * cell.avg) / cell.max : null;
                    return (
                      <td key={c} style={{ background: cellColor(pct) }}>
                        <div className="cell-avg">{cell.avg}</div>
                        <div className="cell-frac">{cell.attempted}/{cell.total}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )
      )}

      {mode === "cs" && (
        <div className="callout">
          <Info size={16} />
          <span>{cs.note || "No CS data available."}</span>
        </div>
      )}

      {mode === "regular" && ranking.length > 0 && (
        <>
          <SectionHeader
            eyebrow="Ranking"
            title="Which schools performed best (by School ID)"
            note="Ranked by average score as a % of max marks, weighted by students assessed, across every class/subject combo the school has data for in this year. Schools with fewer than 2 scored class/subject combos are excluded as too thin to rank fairly."
          />
          <Pills
            options={[
              { value: "top", label: "Top 10" },
              { value: "bottom", label: "Bottom 10" },
            ]}
            value={rankView}
            onChange={setRankView}
          />
          <div className="chart-card">
            <div className="ranked-list">
              {rankedShown.map((r, i) => (
                <div className="ranked-row" key={r.schoolId}>
                  <span className="ranked-index">{rankView === "top" ? i + 1 : ranking.length - i}</span>
                  <div className="ranked-main">
                    <span className="ranked-title">School #{r.schoolId}</span>
                    <span className="ranked-meta">
                      {r.cells} class/subject combos · {r.students} student-entries
                      {r.profile && (
                        <>
                          {r.profile.rte != null && <> · RTE {r.profile.rte}</>}
                          {r.profile.teachers != null && <> · {r.profile.teachers} teachers</>}
                          {r.profile.strength != null && <> · {r.profile.strength} students enrolled</>}
                        </>
                      )}
                    </span>
                  </div>
                  <span className="ranked-count">{r.avgPct}%</span>
                </div>
              ))}
            </div>
          </div>

          {rteScatter.length >= 5 && (
            <>
              <SectionHeader
                eyebrow="School Profile"
                title="Does RTE compliance score relate to assessment performance?"
                note="Each dot is one school: RTE Score (infrastructure/staffing compliance, from schooldetails) vs its average assessment score % this year. This data wasn't shown on the original site — pulled from the schooldetails table in your dump."
              />
              <div className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 8, right: 20, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="#263354" />
                    <XAxis type="number" dataKey="x" name="RTE Score" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} label={{ value: "RTE Score", position: "insideBottom", offset: -4, fill: "#93A0BE", fontSize: 12 }} />
                    <YAxis type="number" dataKey="y" name="Avg Score %" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) =>
                        active && payload && payload.length ? (
                          <div className="chart-tooltip">
                            <div className="tooltip-label">School #{payload[0].payload.schoolId}</div>
                            <div className="tooltip-row"><span>RTE Score</span><span>{payload[0].payload.x}</span></div>
                            <div className="tooltip-row"><span>Avg Score</span><span>{payload[0].payload.y}%</span></div>
                          </div>
                        ) : null
                      }
                    />
                    <Scatter data={rteScatter} fill="#5EEAD4" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}

      <SectionHeader
        eyebrow="Oral Assessment Status"
        title={`Percentage of students at each ${oralSubject} oral level, by class`}
        note="Direct Test implies the student had the standards required for their class and could attempt the written test."
      />
      <Pills
        options={["English", "Maths", "Tamil"].map((s) => ({ value: s, label: s }))}
        value={oralSubject}
        onChange={setOralSubject}
      />
      {oralRows.length === 0 ? (
        <div className="callout"><Info size={16} /><span>No oral assessment records for {oralSubject} in {year}.</span></div>
      ) : (
      <div className="chart-card table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sticky-col">Class</th>
              {Object.keys(oralRows[0] || {})
                .filter((k) => k !== "class")
                .map((k) => (
                  <th key={k}>{k}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {oralRows.map((row) => (
              <tr key={row.class}>
                <td className="sticky-col school-cell">{row.class}</td>
                {Object.keys(row)
                  .filter((k) => k !== "class")
                  .map((k) => (
                    <td key={k}>{row[k]}%</td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}

const STATUS_PALETTE = ["#5EEAD4", "#FBBF24", "#A78BFA", "#FB7185", "#60A5FA", "#34D399", "#F472B6", "#93A0BE"];

function AssessmentAnalysisTab() {
  const [year, setYear] = useState(2018);
  const [sub, setSub] = useState("overview");
  const [subject, setSubject] = useState("English");
  const [wClass, setWClass] = useState("2");
  const yd = REAL_DATA.byYear[year];

  const overviewData = (yd.overallScores[subject] || []).map((r) => ({
    class: `Class ${r.class}`,
    "Written Score %": r.writtenScorePct,
    "Oral Progress %": r.oralProgressPct,
  }));

  const oralOrder = {
    English: ["Pre Letter","Capital Letter","Small Letter","Read Words","Understand Words","Read Sentence","Understand Sentence","Direct Test"],
    Maths: ["Pre Numbers","One Digit Numbers","Two Digit Numbers","Addition","Subtraction","Multiplication","Division"],
    Tamil: ["Letter","Word","Sentence","Paragraph"],
  }[subject];
  const oralData = (yd.oralProgression[subject] || []).map((r) => ({ ...r, class: `Class ${r.class}` }));

  const writtenClasses = Object.keys(yd.writtenQuestionwise).sort((a, b) => +a - +b);
  const writtenSubjects = Object.keys(yd.writtenQuestionwise[wClass] || {});
  const effectiveWSubject = writtenSubjects.includes(subject) ? subject : writtenSubjects[0];
  const writtenData = (yd.writtenQuestionwise[wClass]?.[effectiveWSubject] || []);

  return (
    <>
      <SectionHeader
        eyebrow="AAA"
        title="Assessment Analysis"
        note="Merges the site's Overall Scores, Oral Assessment, and Written Assessment analysis views into one place. This sample doesn't carry two comparable cohorts, so each chart shows the single all-schools series rather than a side-by-side comparison."
      />
      <div className="pill-row">
        <span className="year-label">Year:</span>
        <YearSelect year={year} onChange={setYear} />
      </div>
      <Pills
        options={[
          { value: "overview", label: "Overall Scores" },
          { value: "oral", label: "Oral Assessment" },
          { value: "written", label: "Written Assessment" },
        ]}
        value={sub}
        onChange={setSub}
      />

      {sub !== "written" && (
        <Pills
          options={["English", "Maths", "Tamil"].map((s) => ({ value: s, label: s }))}
          value={subject}
          onChange={setSubject}
        />
      )}

      {sub === "overview" && (
        overviewData.length === 0 ? (
          <div className="callout"><Info size={16} /><span>No {subject} records for {year}.</span></div>
        ) : (
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={overviewData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
              <XAxis dataKey="class" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip suffix="%" />} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line type="monotone" dataKey="Written Score %" stroke="#5EEAD4" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Oral Progress %" stroke="#FBBF24" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        )
      )}

      {sub === "oral" && (
        oralData.length === 0 ? (
          <div className="callout"><Info size={16} /><span>No oral assessment records for {subject} in {year}.</span></div>
        ) : (
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={oralData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
              <XAxis dataKey="class" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip suffix="%" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {oralOrder.map((st, i) => (
                <Line key={st} type="monotone" dataKey={st} stroke={STATUS_PALETTE[i % STATUS_PALETTE.length]} strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="section-note" style={{ marginTop: 8 }}>
            Cumulative: % of assessed students who reached at least this level.
          </p>
        </div>
        )
      )}

      {sub === "written" && (
        writtenClasses.length === 0 ? (
          <div className="callout"><Info size={16} /><span>No written questionwise records for {year}.</span></div>
        ) : (
        <>
          <div className="pill-row" style={{ marginTop: 4 }}>
            {writtenClasses.map((c) => (
              <button key={c} className={"pill" + (wClass === c ? " pill-active" : "")} onClick={() => setWClass(c)}>
                Class {c}
              </button>
            ))}
          </div>
          <div className="pill-row">
            {writtenSubjects.map((s) => (
              <button key={s} className={"pill" + (effectiveWSubject === s ? " pill-active" : "")} onClick={() => setSubject(s)}>
                {s}
              </button>
            ))}
          </div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={writtenData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
                <XAxis dataKey="q" tick={{ fontSize: 11, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Bar dataKey="avgPct" name="Avg score" fill="#60A5FA" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
        )
      )}
    </>
  );
}

function InfluencesTab() {
  return (
    <>
      <SectionHeader
        eyebrow="Family background"
        title="Parental education vs. average score"
        note="Sorted from no formal education to postgraduate — a consistent upward pattern here (not a causal claim) is one of the strongest signals in this dataset."
      />
      <div className="two-col">
        <div className="chart-card">
          <h3 className="mini-title">Mother's education</h3>
          <ComparisonBars data={DATA.correlationMotherEd} colorFn={() => "#5EEAD4"} />
        </div>
        <div className="chart-card">
          <h3 className="mini-title">Father's education</h3>
          <ComparisonBars data={DATA.correlationFatherEd} colorFn={() => "#A78BFA"} />
        </div>
      </div>

      <SectionHeader eyebrow="Everyday factors" title="Home life and daily habits" />
      <div className="three-col">
        <div className="chart-card compact">
          <h3 className="mini-title">Goes to tuition?</h3>
          <ComparisonBars data={DATA.correlationTuition} colorFn={() => "#FBBF24"} />
        </div>
        <div className="chart-card compact">
          <h3 className="mini-title">Eats breakfast?</h3>
          <ComparisonBars data={DATA.correlationBreakfast} colorFn={() => "#FB7185"} />
        </div>
        <div className="chart-card compact">
          <h3 className="mini-title">Does homework regularly?</h3>
          <ComparisonBars data={DATA.correlationHomework} colorFn={() => "#34D399"} />
        </div>
      </div>

      <SectionHeader eyebrow="Groups" title="Gender, location, and assessment style" />
      <div className="three-col">
        <div className="chart-card compact">
          <h3 className="mini-title">By gender</h3>
          <ComparisonBars data={DATA.genderGap} colorFn={(d) => (d.label === "Girls" ? "#FB7185" : "#60A5FA")} />
        </div>
        <div className="chart-card compact">
          <h3 className="mini-title">By school location</h3>
          <ComparisonBars data={DATA.byLocationType} colorFn={() => "#34D399"} />
        </div>
        <div className="chart-card compact">
          <h3 className="mini-title">Oral vs. written/mixed</h3>
          <ComparisonBars data={DATA.oralVsFull} colorFn={() => "#A78BFA"} />
        </div>
      </div>

      <div className="callout">
        <Info size={16} />
        <p>
          These are correlations, not proof of cause and effect — e.g. tuition-goers scoring
          lower likely reflects that struggling students are more often sent to tuition, not
          that tuition itself hurts scores. Useful for spotting patterns worth investigating,
          not for final conclusions.
        </p>
      </div>
    </>
  );
}

function EngagementTab() {
  const maxAction = Math.max(...DATA.topActions.map((a) => a.count));
  const maxSubject = Math.max(...DATA.topSubjectsOpened.map((s) => s.count));
  const maxContent = Math.max(...DATA.topContentOpened.map((c) => c.count));

  return (
    <>
      <SectionHeader
        eyebrow="App usage telemetry"
        title="What students actually do in the app"
        note={`From ${DATA.kpis.usageEvents.toLocaleString()} logged actions across ${DATA.kpis.usageSchools} schools in this sample window.`}
      />
      <div className="chart-card">
        <h3 className="mini-title">Most common actions</h3>
        <div className="funnel">
          {DATA.topActions.map((a) => (
            <div className="funnel-row" key={a.action}>
              <span className="funnel-label">{a.action}</span>
              <div className="funnel-track">
                <div className="funnel-fill" style={{ width: `${(a.count / maxAction) * 100}%` }} />
              </div>
              <span className="funnel-value">{a.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <h3 className="mini-title">Subjects opened most</h3>
          <div className="funnel">
            {DATA.topSubjectsOpened.map((s) => (
              <div className="funnel-row" key={s.subject}>
                <span className="funnel-label">{s.subject}</span>
                <div className="funnel-track">
                  <div className="funnel-fill" style={{ width: `${(s.count / maxSubject) * 100}%`, background: subjectColor(s.subject) }} />
                </div>
                <span className="funnel-value">{s.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="mini-title">Most-opened content</h3>
          <div className="ranked-list">
            {DATA.topContentOpened.map((c, i) => (
              <div className="ranked-row" key={c.title}>
                <span className="ranked-index">{i + 1}</span>
                <span className="ranked-title">{c.title}</span>
                <span className="ranked-count">{c.count}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="callout">
        <Info size={16} />
        <p>
          "Opened" reflects a click into content, not confirmed watch-time — most duration
          values in this sample are near-zero, so genuine engagement depth isn't measurable
          from this export alone.
        </p>
      </div>
    </>
  );
}

export default function Analytics() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="analytics-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

        :root {
          --bg: #0F1729;
          --bg-2: #1A2540;
          --bg-3: #212D4D;
          --ink: #E8ECF4;
          --ink-soft: #93A0BE;
          --ink-faint: #5C6C90;
          --teal: #5EEAD4;
          --amber: #FBBF24;
          --violet: #A78BFA;
          --rose: #FB7185;
          --emerald: #34D399;
          --blue: #60A5FA;
          --line: #263354;
          color-scheme: dark;
        }
        * { box-sizing: border-box; }
        .analytics-root {
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          color-scheme: dark;
        }
        .analytics-root h1, .analytics-root h2, .analytics-root h3 {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          margin: 0;
        }

        .analytics-header {
          background: #0B1220;
          color: var(--ink);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 1px solid var(--line);
        }
        .brand-row { display: flex; align-items: center; gap: 10px; }
        .brand-badge {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, var(--teal), var(--blue));
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #0B1220;
        }
        .brand-text h1 { font-size: 16px; color: var(--ink); line-height: 1.1; }
        .brand-text span { font-size: 10.5px; color: var(--ink-faint); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em; }

        .sample-badge {
          background: rgba(94,234,212,0.08);
          color: var(--teal);
          font-size: 11.5px;
          font-family: 'JetBrains Mono', monospace;
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid rgba(94,234,212,0.25);
        }

        .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--ink);
          background: var(--bg-2);
          border: 1px solid var(--line);
          padding: 6px 12px;
          border-radius: 8px;
          text-decoration: none;
        }
        .back-link:hover { background: var(--bg-3); }

        .tab-nav {
          display: flex;
          gap: 4px;
          background: var(--bg-2);
          border-bottom: 1px solid var(--line);
          padding: 0 24px;
          overflow-x: auto;
        }
        .tab-btn {
          display: flex; align-items: center; gap: 7px;
          background: none; border: none;
          padding: 14px 16px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 13.5px;
          color: var(--ink-faint);
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          white-space: nowrap;
        }
        .tab-btn:hover { color: var(--ink); }
        .tab-btn-active { color: var(--teal); border-bottom-color: var(--teal); }

        .analytics-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 24px 64px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
          margin-bottom: 8px;
        }
        .kpi-card {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .kpi-icon {
          width: 36px; height: 36px;
          background: var(--bg-3);
          color: var(--teal);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .kpi-icon[style] { color: #0B1220; }
        .kpi-value { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600; color: var(--ink); line-height: 1.1; }
        .kpi-label { font-size: 12px; color: var(--ink-soft); margin-top: 3px; font-weight: 600; }
        .kpi-sub { font-size: 10.5px; color: var(--ink-faint); margin-top: 2px; }

        .section-header { margin: 32px 0 14px; }
        .section-header .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--blue); font-weight: 600;
        }
        .section-header h2 { font-size: 20px; color: var(--ink); margin: 4px 0 6px; }
        .section-note { font-size: 13px; color: var(--ink-soft); margin: 0; max-width: 640px; line-height: 1.45; }

        .chart-card {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 20px;
        }
        .chart-card.compact { padding: 16px; }
        .mini-title {
          font-size: 14px; font-weight: 600; color: var(--ink);
          display: flex; align-items: center; gap: 6px;
          margin: 0 0 14px;
        }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px; }

        .chart-tooltip {
          background: #060A14; color: var(--ink);
          padding: 10px 12px; border-radius: 10px; font-size: 12.5px;
          border: 1px solid var(--line);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .tooltip-label { font-weight: 700; margin-bottom: 4px; font-family: 'Space Grotesk', sans-serif; }
        .tooltip-row { display: flex; align-items: center; gap: 6px; margin-top: 2px; color: var(--ink-soft); }
        .tooltip-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

        .topic-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .topic-bar-label {
          width: 180px; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 1px;
          font-size: 12.5px; font-weight: 600; color: var(--ink);
        }
        .topic-subject-chip { font-size: 10.5px; font-weight: 600; }
        .topic-bar-track { flex: 1; height: 10px; background: var(--bg-3); border-radius: 999px; overflow: hidden; }
        .topic-bar-fill { height: 100%; border-radius: 999px; }
        .topic-bar-pct { font-size: 12px; font-weight: 700; color: var(--ink-soft); width: 38px; text-align: right; font-family: 'JetBrains Mono', monospace; }

        .compare-bars { display: flex; flex-direction: column; gap: 12px; }
        .compare-row { display: flex; align-items: center; gap: 10px; }
        .compare-label { width: 110px; flex-shrink: 0; font-size: 12.5px; font-weight: 600; color: var(--ink); }
        .compare-track { flex: 1; height: 12px; background: var(--bg-3); border-radius: 999px; overflow: hidden; }
        .compare-fill { height: 100%; border-radius: 999px; }
        .compare-value { font-size: 12.5px; font-weight: 700; color: var(--ink); width: 40px; text-align: right; font-family: 'JetBrains Mono', monospace; }
        .compare-n { font-size: 10.5px; color: var(--ink-faint); width: 55px; font-family: 'JetBrains Mono', monospace; }

        .funnel { display: flex; flex-direction: column; gap: 10px; }
        .funnel-row { display: flex; align-items: center; gap: 10px; }
        .funnel-label { width: 140px; flex-shrink: 0; font-size: 12.5px; font-weight: 600; color: var(--ink); }
        .funnel-track { flex: 1; height: 14px; background: var(--bg-3); border-radius: 999px; overflow: hidden; }
        .funnel-fill { height: 100%; border-radius: 999px; background: var(--blue); }
        .funnel-value { font-size: 12px; font-weight: 700; color: var(--ink-soft); width: 50px; text-align: right; font-family: 'JetBrains Mono', monospace; }

        .ranked-list { display: flex; flex-direction: column; }
        .ranked-row {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid var(--bg-3);
        }
        .ranked-row:last-child { border-bottom: none; }
        .ranked-index {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--bg-3); color: var(--teal);
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-family: 'Space Grotesk', sans-serif;
        }
        .ranked-title { font-size: 12.5px; font-weight: 600; color: var(--ink); text-align: left; }
        .ranked-count { font-size: 12px; color: var(--teal); font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }
        .ranked-main { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; text-align: left; }
        .ranked-meta { font-size: 10.5px; color: var(--ink-faint); font-family: 'JetBrains Mono', monospace; white-space: normal; text-align: left; }

        .callout {
          display: flex; gap: 10px; align-items: flex-start;
          background: var(--bg-2); border: 1px solid var(--line); border-radius: 14px;
          padding: 14px 16px; margin-top: 24px;
          color: var(--ink-soft); font-size: 12.5px; line-height: 1.5;
        }
        .callout svg { flex-shrink: 0; margin-top: 1px; color: var(--blue); }
        .callout code {
          background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 4px;
          font-family: 'JetBrains Mono', monospace; font-size: 11.5px;
          color: var(--teal);
        }

        .pill-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0; align-items: center; }
        .year-label { font-size: 12.5px; color: var(--ink-soft); font-weight: 600; margin-right: 2px; }
        .year-select {
          background: var(--bg-2); border: 1px solid var(--line); color: var(--ink);
          font-size: 12.5px; font-weight: 600; padding: 7px 12px; border-radius: 999px;
          cursor: pointer; font-family: 'JetBrains Mono', monospace;
        }
        .year-select:hover { border-color: var(--teal); }
        .pill {
          background: var(--bg-2); border: 1px solid var(--line); color: var(--ink-soft);
          font-size: 12.5px; font-weight: 600; padding: 7px 14px; border-radius: 999px;
          cursor: pointer; transition: all 0.15s;
        }
        .pill:hover { border-color: var(--teal); color: var(--ink); }
        .pill-active { background: var(--teal); color: #05201c; border-color: var(--teal); }

        .table-scroll { overflow-x: auto; padding: 0; }
        .data-table { border-collapse: collapse; width: 100%; font-size: 12.5px; white-space: nowrap; }
        .data-table th, .data-table td {
          padding: 10px 12px; text-align: center; border-bottom: 1px solid var(--bg-3);
        }
        .data-table th {
          color: var(--teal); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em;
          background: var(--bg-2); position: sticky; top: 0;
        }
        .data-table td { color: var(--ink-soft); }
        .sticky-col {
          position: sticky; left: 0; background: var(--bg); z-index: 1;
          text-align: left !important;
        }
        .school-cell { color: var(--ink); font-weight: 600; }
        .dim-cell { color: #4A5578; }
        .cell-avg { font-weight: 700; color: var(--ink); font-family: 'JetBrains Mono', monospace; }
        .cell-frac { font-size: 10.5px; color: var(--ink-soft); }

        @media (max-width: 760px) {
          .two-col, .three-col { grid-template-columns: 1fr; }
          .topic-bar-label { width: 120px; }
        }
      `}</style>

      <header className="analytics-header">
        <div className="brand-row">
          <div className="brand-badge"><BarChart3 size={18} /></div>
          <div className="brand-text">
            <h1>Kanini Padhai · Analytics</h1>
            <span>ASSESSMENT & USAGE INSIGHTS</span>
          </div>
        </div>
        <div className="header-actions">
          <a href="/" className="back-link">← Back to Dashboard</a>
          <span className="sample-badge">Sample data export · {DATA.kpis.yearRange[0]}–{DATA.kpis.yearRange[1]}</span>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={"tab-btn" + (tab === t.id ? " tab-btn-active" : "")}
              onClick={() => setTab(t.id)}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </nav>

      <main className="analytics-main">
        {tab === "overview" && <OverviewTab />}
        {tab === "performance" && <PerformanceTab />}
        {tab === "school-averages" && <SchoolAveragesTab />}
        {tab === "assessment-analysis" && <AssessmentAnalysisTab />}
        {tab === "influences" && <InfluencesTab />}
        {tab === "engagement" && <EngagementTab />}
      </main>
    </div>
  );
}
