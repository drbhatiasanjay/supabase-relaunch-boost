-- Insert test bookmarks for hemasanjay501@gmail.com
INSERT INTO public.bookmarks (user_id, title, url, description, tags, category, reading) VALUES
-- User 2: hemasanjay501@gmail.com (73e09d0c-74b8-4bd4-b26d-f16c1dd86b68)
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'Vue.js Documentation', 'https://vuejs.org', 'Progressive JavaScript framework for building user interfaces', ARRAY['vue', 'javascript', 'frontend'], 'Development', true),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'Node.js Best Practices', 'https://github.com/goldbergyoni/nodebestpractices', 'Comprehensive guide to Node.js best practices', ARRAY['nodejs', 'backend', 'javascript', 'best-practices'], 'Development', false),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'AWS Documentation', 'https://docs.aws.amazon.com', 'Amazon Web Services complete documentation', ARRAY['aws', 'cloud', 'infrastructure'], 'Cloud', true),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'MongoDB University', 'https://university.mongodb.com', 'Free MongoDB courses and certifications', ARRAY['mongodb', 'database', 'nosql', 'learning'], 'Learning', false),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'Docker Documentation', 'https://docs.docker.com', 'Learn containerization with Docker', ARRAY['docker', 'devops', 'containers'], 'DevOps', true),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'Postman API Platform', 'https://www.postman.com', 'API development and testing platform', ARRAY['api', 'testing', 'tools'], 'Tools', false),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'Medium Tech Articles', 'https://medium.com/tag/technology', 'Technology articles and tutorials', ARRAY['blog', 'articles', 'learning'], 'Reading', false),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'LeetCode Problems', 'https://leetcode.com', 'Practice coding interview questions', ARRAY['algorithms', 'interview', 'practice'], 'Learning', true),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'Redis Documentation', 'https://redis.io/docs', 'In-memory data structure store documentation', ARRAY['redis', 'cache', 'database'], 'Development', false),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'GraphQL Official', 'https://graphql.org', 'Query language for APIs', ARRAY['graphql', 'api', 'backend'], 'Development', false),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'Kubernetes Docs', 'https://kubernetes.io/docs', 'Container orchestration platform', ARRAY['kubernetes', 'devops', 'containers'], 'DevOps', true),
('73e09d0c-74b8-4bd4-b26d-f16c1dd86b68', 'Behance Design Portfolio', 'https://www.behance.net', 'Showcase and discover creative work', ARRAY['design', 'portfolio', 'inspiration'], 'Design', false),

-- Additional bookmarks for drbhatiasanjay@gmail.com (00c93726-e58d-4f12-bfcb-2b76f237b652)
('00c93726-e58d-4f12-bfcb-2b76f237b652', 'Next.js Documentation', 'https://nextjs.org/docs', 'React framework for production applications', ARRAY['nextjs', 'react', 'frontend', 'ssr'], 'Development', true),
('00c93726-e58d-4f12-bfcb-2b76f237b652', 'Prisma ORM', 'https://www.prisma.io', 'Next-generation ORM for Node.js and TypeScript', ARRAY['prisma', 'orm', 'database'], 'Development', false),
('00c93726-e58d-4f12-bfcb-2b76f237b652', 'shadcn/ui Components', 'https://ui.shadcn.com', 'Beautifully designed components built with Radix UI', ARRAY['ui', 'components', 'react', 'tailwind'], 'Design', true),
('00c93726-e58d-4f12-bfcb-2b76f237b652', 'Framer Motion', 'https://www.framer.com/motion', 'Production-ready animation library for React', ARRAY['animation', 'react', 'ui'], 'Development', false),
('00c93726-e58d-4f12-bfcb-2b76f237b652', 'Git Best Practices', 'https://git-scm.com/book', 'Pro Git book - everything about Git', ARRAY['git', 'version-control', 'best-practices'], 'Learning', false),
('00c93726-e58d-4f12-bfcb-2b76f237b652', 'Web.dev by Google', 'https://web.dev', 'Guidance on modern web development', ARRAY['webdev', 'performance', 'google'], 'Learning', true),
('00c93726-e58d-4f12-bfcb-2b76f237b652', 'FontAwesome Icons', 'https://fontawesome.com', 'Icon library and toolkit', ARRAY['icons', 'design', 'ui'], 'Design', false),
('00c93726-e58d-4f12-bfcb-2b76f237b652', 'Jest Testing Library', 'https://jestjs.io', 'Delightful JavaScript testing framework', ARRAY['testing', 'javascript', 'jest'], 'Development', false);