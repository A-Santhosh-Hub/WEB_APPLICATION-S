<?php
include_once 'classes/db1.php';?>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Inter College Event | Login</title>
        <title></title>
        <style>
            span.error{
                color: red;
            }            
        </style>  
        <?php require 'utils/styles.php'; ?><!--css links. file found in utils folder-->
            </head>
    <body>
        <?php require 'utils/header.php'; ?><!--header content. file found in utils folder-->
        <div class = "content"><!--body content holder-->
            <div class = "container">
                <div class ="col-md-6 col-md-offset-3">
                  
                    <form method="POST" action="RegisteredEvents.php"><!--form-->
                      
                            <!--username field-->
                            <label>Stduent Usn:</label><br>
        <input type="text" name="usn" class="form-control" required><br>
        <label>Event Id:</label><br>
        <input type="text" name="event_id" class="form-control" required><br>
                            
                
                        <button type = "submit" name="eventregister" class = "btn btn-default">Register</button>
                    </form>
                </div><!--col md 6 div-->
            </div><!--container div-->
        </div><!--content div-->
        <?php require 'utils/footer.php'; ?><!--footer content. file found in utils folder-->
    </body>
</html>
<?php

if(isset($_POST['eventregister'])) 
{
    $usn=$_POST['usn'];
    $event_id=$_POST['event_id'];
    
    
    
        
  $query="insert into registered(usn,event_id) values ('$usn' , '$event_id')";
    
    $result=mysqli_query($conn,$query);
    
    if($result){
        echo "<script>
          alert('Register Successfully!');
          </script>";
    }
    else{
        echo"<script>
          alert('Not Register!');
          window.location.href='eventregister.php';
          </script>";
    }

}

    
    

   
?>    