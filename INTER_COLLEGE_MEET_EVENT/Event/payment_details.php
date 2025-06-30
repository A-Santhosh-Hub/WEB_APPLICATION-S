<?php
include_once 'classes/db1.php';
$result = mysqli_query($conn,"SELECT usn,payername,transactionid,amount,phone FROM payment");
?>


<!DOCTYPE html>
<html>

<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Inter College Event |Payment</title>
</head>
    
    <body>
<?php include 'utils/adminHeader.php'?>
 
    
        <div class = "content">
            <div class = "container">
            <h1>Payment details</h1>
            <?php
if (mysqli_num_rows($result) > 0) {
?>
                <table class="table table-hover" >
                    <thead>
                        <tr>
                            
                            <th>USN</th>
                            <th>Payer Name</th>
                            <th>Transaction Id</th>
                            <th>Amount</th>
                            <th>Phone No</th>
                          
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                     $i=0;
                     while($row = mysqli_fetch_array($result)){
                            echo '<tr>';
                
                   
                             echo '<td>' . $row['usn'] . '</td>';                    
                            echo '<td>' . $row['payername'] . '</td>';
                            echo '<td>' . $row['transactionid'] . '</td>';
                            echo '<td>' . $row['amount'] . '</td>';
                            echo '<td>' . $row['phone'] . '</td>';
                            
                            echo '</tr>';  

                            
                $i++;
                        }
                      
                        ?>
                    </tbody>
                </table>
<?php
}

?>             
                
            </div>
        </div>
        
        <?php require 'utils/footer.php'; ?>
    </body>
</html>
