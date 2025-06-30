<?php
require 'classes/db1.php';
$id=$_GET['id'];
$result = mysqli_query($conn,"SELECT * FROM participent WHERE event_id=$id ");
?>

<!DOCTYPE html>
<html>

<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Inter College Event |Admin</title>
</head>
    
    <body>
<?php include 'utils/adminHeader.php'?>
 
    
        <div class = "content">
            <div class = "container">
            <h1>Event details</h1>
                <table class="table table-hover" >
                    <thead>
                        <tr>
                            <th>UserName</th>
                            <th>Name</th>
                            <th>College</th>
                            <th>Phone</th>
                            
                          
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                if (mysqli_num_rows($result) > 0) {

                 $i=0;
                while($row = mysqli_fetch_array($result)) {
                            echo '<tr>';
                
                   
                                               
                            echo '<td>' . $row['usn'] . '</td>';
                            echo '<td>' . $row['name'] . '</td>';
                            echo '<td>'.$row['college'].'</td>';
                            echo '<td>'.$row['phone'].'</td>';
                            
                            echo '<td>';
                            echo'</tr>';  

                            
                $i++;
                        }
                      }
                        ?>
                    </tbody>
                </table>
<?php


?>             
               
            </div>
        </div>
        
        <?php require 'utils/footer.php'; ?>
    </body>
</html>