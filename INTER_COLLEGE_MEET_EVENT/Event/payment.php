
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Inter College Event | Payment </title>
        <?php require 'utils/styles.php'; ?>
        
    </head>
    <body>
    <?php require 'utils/header.php'; ?>
    <div class ="content"><!--body content holder-->
            <div class = "container">
                <div class ="col-md-6 col-md-offset-3">
    <form method="POST">
         
        <h3 style="color:red;"> UPI : 9842123720@paytm  </h3><br><br>
   
        <label>Student Username / roll :</label><br>
        <input type="text" name="usn" class="form-control" required><br><br>

        <label>Payer Name:</label><br>
        <input type="text" name="payname" class="form-control" required><br><br>

        <label>Transaction Id:</label><br>
        <input type="text" name="transid" class="form-control" required><br><br>

        <label>Amount:</label><br>
        <input type="text" name="amount" class="form-control" required><br><br>

        <label>Phone No:</label><br>
        <input type="text" name="phone" class="form-control" required><br><br>

        <button type="submit" name="pay" required>Pay</button><br><br>

    </div>
    </div>
    </div>
    </form>
    

    <?php require 'utils/footer.php'; ?>
    </body>
</html>

<?php

    if (isset($_POST["pay"]))
    {
        $usn=$_POST["usn"];
        $payname=$_POST["payname"];
        $transid=$_POST["transid"];
        $amount=$_POST["amount"];
        $phone=$_POST["phone"];

        if( !empty($usn) || !empty($payname) || !empty($transid) || !empty($amount) || !empty($phone) )
        {
        
            include 'classes/db1.php';     
                $INSERT="INSERT INTO payment (usn,payername,transactionid,amount,phone) VALUES('$usn','$payname','$transid','$amount','$phone')";

          
                if($conn->query($INSERT)===True){
                    echo "<script>
                    alert('Payment Successfully!');
                    window.location.href='index.php';
                    </script>";
                }
                else
                {
                    echo"<script>
                    alert(' Already Pay this usn');
                    window.location.href='index.php';
                    </script>";
                }
               
                $conn->close();
            
        }
        else
        {
            echo"<script>
            alert('All fields are required');
            window.location.href='register.php';
                    </script>";
        }
    }
    
?>