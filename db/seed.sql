INSERT INTO profile (id, name, title, objective, phone, email, location, linkedin)
VALUES (
  1,
  'Withanage Pramod Chinthaka',
  'SQA Engineer',
  'I am a young energetic and dynamic individual who is searching for a working environment where I can work effectively using my talents and capabilities. I assure that I can perform as a Software Quality Assurance Engineer using my knowledge and abilities for the satisfaction of the organization.',
  '+94774190017 / +94412260477',
  'chinthaka.wit@gmail.com',
  'Matara, Sri Lanka',
  'linkedin.com/in/chinthaka-withanage'
);

INSERT INTO experience (company, location, period, sort_order) VALUES
('Allion Technologies (Pvt) Ltd', 'No 162 2/1, Nawala Road, Nugegoda, Sri Lanka', '2022 - Present', 1),
('Mood Electronic Marketing (Holoteq Group)', 'Marina 50 Tower, 5th floor, Lusail City, Qatar', '2021 - 2022', 2),
('SQA Engineer - MI Synergy (Pvt) Ltd', '8B, Somadevi Place, Kirulapone, Colombo 05, Sri Lanka', '2019 - 2021', 3),
('Junior QA Engineer - Virtusa (Pvt) Limited', '752 Dr Danister De Silva Mawatha, Colombo 00900', '2016 - 2017', 4);

INSERT INTO education (institution, qualification, period, details, sort_order) VALUES
('National School of Business Management (NSBM) / University College Dublin - Ireland', '2nd Class Honours in BSc in Computer Science', '2012 - 2016', NULL, 1),
('National Institute of Business Management (NIBM)', 'Higher Diploma in Computer Based Information System', '2013 - 2014', 'Successfully Completed', 2),
('National Institute of Business Management (NIBM)', 'Diploma in Computer System Design', '2012 - 2013', 'Successfully Completed', 3);

INSERT INTO certifications (name, issuer, issued_date, credential_id, sort_order) VALUES
('Certified Tester Foundation Level (CTFL)', 'ISTQB - International Software Testing Qualifications Board', 'Jun 2023', 'SL-CTFL-2306-4022', 1);

INSERT INTO skills (name, sort_order) VALUES
('Fast Learning', 1),
('Agentic Programming', 2),
('Agentic Testing', 3),
('Problem Solving', 4),
('Decision Making', 5),
('Good Team Player', 6);

INSERT INTO projects (title, description, technology, tools, status, sort_order) VALUES
('InsurePro (US) - SDK Testing', 'QA engineer on InsurePro, a US-based project run with partner Rex; tested SDK integrations end-to-end.', 'Playwright, WebDriver.io, SDK/integration testing', 'Playwright, WebDriver.io, Git', 'Completed', 1),
('AgeChecked - Age Verification Platform (UK)', 'QA engineer on a project for AgeChecked, a UK (London-based) age-verification reg-tech provider that helps online retailers verify customer age for age-restricted goods and services. Built API test automation and led load testing of verification workflows, and developed in-house testing tools/utilities to support the QA process.', 'Karate API automation framework, JMeter load testing, custom testing-tool development', 'Karate DSL, JMeter, Postman, Git', 'Completed', 2),
('People''s Insurance - CAMS', 'Sole QA on a web app gathering leads from island-wide agents; automated and load-tested lead-gathering events; created and executed test plans.', 'React JS, JSON, Groovy scripts, GitLab vulnerability scanning, Java', 'JMeter, SoapUI, Postman, Navicat, Burp Suite, Testlink, Redmine', 'Live', 3),
('HDFC e-Banking System', 'Sole QA for a digital banking portal handling transfers and payments; automated and performance-tested OTP and transaction services.', 'Angular, JSON, Groovy scripts, GitLab vulnerability scanning, Java', 'JMeter, SoapUI, Postman, Navicat, Burp Suite, Testlink, Redmine', 'Live', 4),
('Fair First Insurance - LMS and Mobile App', 'Sole QA on a lead-gathering web app for island-wide agents; automated and load-tested lead-gathering events; created and executed test plans.', 'React JS, JSON, Groovy scripts, GitLab vulnerability scanning, Java', 'JMeter, SoapUI, Postman, Navicat, Burp Suite, Testlink, Redmine', 'Live', 5),
('TIS Virtual Wallet', 'One of two QAs testing the transaction module of a virtual wallet with Mobitel, focused on rural users on 2G networks with low-resolution feature phones.', 'CSS, React JS, JSON, Groovy scripts, GitLab vulnerability scanning, Java', 'JMeter, SoapUI, Postman, Adminer, Burp Suite, Testlink, Redmine', 'UAT', 6),
('Mood Go (Messenger)', 'Social app supporting social gatherings, taxi hire, food ordering and story sharing.', 'JIRA, performance testing, JavaScript, Groovy scripts', 'Appium, DBeaver, Postman, Vysor, Scrcpy', 'Live', 7);

INSERT INTO achievements (title, category, achievement_date, description, sort_order) VALUES
('ISTQB Certified Tester Foundation Level (CTFL)', 'Certification', '2023-06-01', 'Earned the ISTQB Foundation Level certification, credential ID SL-CTFL-2306-4022.', 1),
('Add your next achievement here', 'Milestone', NULL, 'Use the back office to log new awards, promotions, certifications or project wins as they happen.', 2);

INSERT INTO referees (name, credentials, organization, phone, email, linkedin, sort_order) VALUES
('Mr. Thepul Ginige', 'B.Sc (USJ), B.Sc (Hons) SLIIT, MIT (UCSC), MCS (SL)', 'University of Colombo School of Computing (UCSC), Colombo, Sri Lanka', '+9471-4803326', 'thepulg2003@yahoo.com', NULL, 1),
('Mr. Gawesh Chithrarathne', 'Operations & Delivery Manager', NULL, '+94768091470', NULL, 'linkedin.com/in/gawesh-chithrarathne', 2);
