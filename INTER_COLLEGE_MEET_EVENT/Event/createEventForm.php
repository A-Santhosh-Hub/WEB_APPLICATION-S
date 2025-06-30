<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Inter College Event | Add Event</title>
    <?php require 'utils/styles.php'; ?>
    <script>
        function previewImage(event) {
            const reader = new FileReader();
            reader.onload = function(){
                const output = document.getElementById('imgPreview');
                output.src = reader.result;
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    </script>
</head>
<body>
    <?php require 'utils/adminHeader.php'; ?>
    <form method="POST" enctype="multipart/form-data">
        <div class="w3-container"> 
            <div class="content">
                <div class="container">
                    <div class="col-md-6 col-md-offset-3">
                        <label>Event ID:</label><br>
                        <input type="number" name="event_id" required class="form-control"><br><br>

                        <label>Event Name:</label><br>
                        <input type="text" name="event_title" required class="form-control"><br><br>

                        <label>Upload Image:</label><br>
                        <input type="file" name="image" required class="form-control" accept="image/*" onchange="previewImage(event)"><br><br>
                        <img id="imgPreview" src="#" alt="Image Preview" style="max-width: 100%; height: auto; display: none;"><br><br>

                        <label>Type ID:</label><br>
                        <input type="number" name="type_id" required class="form-control"><br><br>

                        <label>Event Date:</label><br>
                        <input type="date" name="Date" required class="form-control"><br><br>

                        <label>Event Time:</label><br>
                        <input type="text" name="time" required class="form-control"><br><br>

                        <label>Event Location:</label><br>
                        <input type="text" name="location" required class="form-control"><br><br>

                        <label>Staff Coordinator Name:</label><br>
                        <input type="text" name="sname" required class="form-control"><br><br>

                        <label>Student Coordinator Name:</label><br>
                        <input type="text" name="st_name" required class="form-control"><br><br>

                        <button type="submit" name="update" class="btn btn-default pull-right">
                            Create Event <span class="glyphicon glyphicon-send"></span>
                        </button>
                        <a class="btn btn-default navbar-btn" href="adminPage.php">
                            <span class="glyphicon glyphicon-circle-arrow-left"></span> Back
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </form>
</body>
<?php require 'utils/footer.php'; ?>
</html>

<?php
if (isset($_POST["update"])) {
    $event_id = $_POST["event_id"];
    $event_title = $_POST["event_title"];
    $type_id = $_POST["type_id"];
    $name = $_POST["sname"];
    $st_name = $_POST["st_name"];
    $Date = $_POST["Date"];
    $time = $_POST["time"];
    $location = $_POST["location"];

    // Check if image is uploaded
    if ($_FILES['image']['error'] == UPLOAD_ERR_OK) {
        $imageTmpName = $_FILES['image']['tmp_name'];
        $imageName = basename($_FILES['image']['name']);
        $uploadDir = 'uploads/';
        $img_link = $uploadDir . $imageName;

        // Create upload directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Move uploaded file to upload directory
        if (move_uploaded_file($imageTmpName, $img_link)) {
            include 'classes/db1.php';

            // SQL queries to insert data into tables
            $INSERT = "INSERT INTO events (event_id, event_title, img_link, type_id) 
                       VALUES ('$event_id', '$event_title', '$img_link', '$type_id');";

            $INSERT .= "INSERT INTO event_info (event_id, Date, time, location) 
                       VALUES ('$event_id', '$Date', '$time', '$location');";

            $INSERT .= "INSERT INTO student_coordinator (sid, st_name, phone, event_id) 
                       VALUES ('$event_id', '$st_name', NULL, '$event_id');";

            $INSERT .= "INSERT INTO staff_coordinator (stid, name, phone, event_id) 
                       VALUES ('$event_id', '$name', NULL, '$event_id');";

            if ($conn->multi_query($INSERT) === true) {
                echo "<script>
                      alert('Event Inserted Successfully!');
                      window.location.href='adminPage.php';
                      </script>";
            } else {
                echo "<script>
                      alert('Event already exists or there was an error!');
                      window.location.href='createEventForm.php';
                      </script>";
            }
            $conn->close();
        } else {
            echo "<script>alert('Failed to upload image.');</script>";
        }
    } else {
        echo "<script>alert('Please upload an image.');</script>";
    }
}
?>