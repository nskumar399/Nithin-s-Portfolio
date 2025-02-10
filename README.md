# Nithin-s-Portfolio
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nithin Satya Kumar - Portfolio</title>
    <link rel="stylesheet" href="styles.css">
    <script defer src="script.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            text-align: center;
        }
        header {
            background: #0073e6;
            color: white;
            padding: 20px;
        }
        nav ul {
            list-style: none;
            padding: 0;
        }
        nav ul li {
            display: inline;
            margin: 0 15px;
        }
        nav a {
            color: white;
            text-decoration: none;
        }
        .fade-in {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
        }
        section {
            padding: 50px 20px;
        }
        .project {
            background: white;
            padding: 20px;
            margin: 10px auto;
            width: 80%;
            border-radius: 8px;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        }
        footer {
            background: #333;
            color: white;
            padding: 10px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <header>
        <h1>Nithin Satya Kumar</h1>
        <p>Mechanical Engineering | AI & ML Enthusiast</p>
        <nav>
            <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <section id="about" class="fade-in">
        <h2>About Me</h2>
        <p>Third-year B.Tech Mechanical Engineering student with a Minor in AI and ML. Passionate about integrating AI in mechanical systems.</p>
        <h3>Technical Skills</h3>
        <ul>
            <li>Python (Intermediate)</li>
            <li>Java (Basic)</li>
            <li>Data Structures</li>
            <li>AI & ML</li>
        </ul>
    </section>

    <section id="projects" class="fade-in">
        <h2>Projects</h2>
        <div class="project">
            <h3>Smart Shopping Cart using Arduino</h3>
            <p>Automating shopping tasks using sensors and Arduino.</p>
        </div>
        <div class="project">
            <h3>Crystal Clear Vision</h3>
            <p>Revolutionizing cataract prediction using transfer learning.</p>
        </div>
    </section>

    <section id="blog" class="fade-in">
        <h2>Blog</h2>
        <p>Stay tuned for posts on AI, ML, and Mechanical Engineering innovations.</p>
    </section>

    <section id="contact" class="fade-in">
        <h2>Contact</h2>
        <p>Email: bnskumar399@gmail.com</p>
        <p>Phone: 7893748343</p>
    </section>

    <footer>
        <p>&copy; 2025 Nithin Satya Kumar</p>
    </footer>

    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const sections = document.querySelectorAll(".fade-in");
            const options = {
                threshold: 0.1
            };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                    }
                });
            }, options);
            sections.forEach(section => {
                observer.observe(section);
            });
        });
    </script>
</body>
</html>
