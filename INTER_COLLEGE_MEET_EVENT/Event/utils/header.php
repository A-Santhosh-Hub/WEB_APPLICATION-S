<style>
*{

}
    body {
        margin: 0;
        padding: 0;
        background: transparent; /* Ensure body background is transparent */
        font-family: Arial, sans-serif;
        color: white;
    }

    /* Background Image */
    .bgImage {
        background-image: url(images/nct.jpg);
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        height: 750px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        text-align: center;
        padding: 10px;
        color: white;
    }

    /* Header Text Styling */
    .bgImage h1 {
        font-size: 48px;
        font-weight: bold;
        margin: 10px 0;
        color: rgb(0, 128, 255); /* Changed color to RGB */
        font-family: 'Georgia', serif; /* Changed font */
    }

    .bgImage h2 {
        font-size: 36px;
        margin: 5px 0;
        color: rgb(0, 128, 255); /* Changed color to RGB */
        font-family: 'Georgia', serif; /* Changed font */
    }

    .bgImage p {
        font-size: 18px;
        margin: 10px 0 20px 0;
    }

    /* Navbar Styling */
    .navbar-default {
        background: transparent;
        margin-top: -250px;
        border: none;
        color: blue; /* Changed text color to blue */
    }

    .navbar-default a {
        color: blue; /* Changed link color to blue */
        font-weight: bold;
    }

    /* Event Section Styling */
    .main-content {
        padding: 50px 20px;
        text-align: center;
        background: transparent; /* Ensure section background is transparent */
    }

    .main-content h2 {
        font-size: 28px;
        color: #0033cc;
        margin-bottom: 20px;
    }

    .main-content a {
        font-size: 20px;
        color: #28a745;
        text-decoration: none;
        margin: 10px;
        display: inline-block;
    }

    .main-content a:hover {
        text-decoration: underline;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .bgImage h1 {
            font-size: 36px;
        }

        .bgImage h2 {
            font-size: 28px;
        }

        .main-content h2 {
            font-size: 24px;
        }

        .main-content a {
            font-size: 18px;
        }
    }

    /* Logo Styling */
    .logo {
        width: 100px; /* Adjusted logo size */
        height: auto;
        position: absolute; /* Positioned for better placement */
        top: 10px; /* Adjust to your preference */
        left: 10px; /* Adjust to your preference */
    }
</style>

<body>
    <header class="bgImage">
        <nav class="navbar navbar-default">
            <div class="container">
                <div class="navbar-header">
                    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>
                    <a class="navbar-brand" href="#">
                        <img src="images/987.png" class="logo" alt="Logo">
                    </a>
                </div>
                <div class="collapse navbar-collapse" id="myNavbar">
                    <ul class="nav navbar-nav navbar-right">
                        <li><a href="index.php">Home</a></li>
                        <li><a href="register.php">Student Register</a></li>
                        <li><a href="judge/index.php">Staff Login</a></li>
                        <li><a href="payment.php">Payment</a></li>
                        <li><a href="contact.php">Contact Us</a></li>
                        <li><a href="aboutus.php">About Us</a></li>
                        <li class="btnlogout">
                            <a class="btn btn-default navbar-btn" href="login_form.php">Organizer <span class="glyphicon glyphicon-log-in"></span></a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        <div class="container">
            <div class="jumbotron">
                <h1>Nandha Engineering College</h1>
                <h2>"SYNETICS"</h2>
                <h2>"2K24"</h2>
            </div>
        </div>
    </header>

  
</body>
