-- System settings seed data
INSERT INTO public.system_settings (setting_key, setting_value, setting_type)
VALUES ('video', 'false', 'boolean'),
       ('terms', $$
USE OF THE IGDB DOG STATUS APP
TERMS AND CONDITIONS FOR USE:
The IGDB Dog Status App uses Supabase as the database platform. Approved users may only utilize the IGDB Dog Status App in compliance with the following:
1. Pictures and texts posted to the app must focus exclusively on the current status of the dog, and present that status in a positive light.
2. Posts must not include any identifying information regarding the person posting, nor any other person (including person names, faces, or photos of home addresses).
3. Users must not include any of the following in posts:
a. Photos or text regarding dogs who are injured, ill, or recovering from medical procedures
b. Photos or text of dogs wearing a Halti
c. Photos or text of dogs exhibiting 'rule breaking behavior' such as sitting on furniture, digging in gardens, stealing shoes, inappropriate chewing, etc.
d. Photos or texts of dogs eating inappropriate food
e. Photos or text showing the body of dogs who have gained excessive weight (photos of the dog’s face would be acceptable)
4. Users with posting privileges agree to post pictures and text only of the dog in their care, and to do so at least once per month.
5. User Login data must not be shared with other people.
$$, 'string');
