<?php
require 'classes/db1.php';
$id=$_GET['id'];
$result = mysqli_query($conn,"SELECT * FROM events,event_info ef,student_coordinator s,staff_coordinator st WHERE type_id = $id and ef.event_id=events.event_id and s.event_id=events.event_id and st.event_id=events.event_id  ");
?>


<!DOCTYPE html>
<html>
<head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>santhosh 2K24</title>
        <title></title>
        <?php require 'utils/styles.php'; ?>
        
    </head>

    <body>
   
    
        <?php require 'utils/header.php'; ?>
       
        <div class = "content">
            <div class = "container">
                <div class = "col-md-12">
                   

            </div>
       
         
            <?php
                if (mysqli_num_rows($result) > 0) {

                 $i=0;
                while($row = mysqli_fetch_array($result)) {
             
                include 'events.php';  
                
                $i++;
                    }
           ?>
<div class="container">
            <div class="col-md-12">
            <hr>
            </div>
            </div>
        <?php }?>
            <a class="btn btn-default" href="index.php"><span class="glyphicon glyphicon-circle-arrow-left"></span> Back</a>
            

        

        </div>

     
        <?php require 'utils/footer.php'; ?>
    </body>
    
</html>
