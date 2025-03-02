document.querySelector("#logOutBtn").addEventListener("click",()=>{
    window.location.href="/";
 });
 document.querySelector("#brand").addEventListener("click",()=>{
   document.querySelector("#brand").href = "/sign";
 });

 document.querySelector("#homebtn").addEventListener("click",()=>{
   document.querySelector("#homebtn").href = "/sign";
 });

 var borrowHistoryButtons=document.querySelectorAll(".borrowHistory");
   for(var i=0;i<borrowHistoryButtons.length;i++){
     borrowHistoryButtons[i].addEventListener("click",()=>{
       /*Borrow history sayfasına yönlendirme yapılacak*/
         window.location.href="/borrowHistory";
     });
   }

 var borrowBookButtons=document.querySelectorAll(".borrowBook");
 for(var i=0;i<borrowBookButtons.length;i++){
   borrowBookButtons[i].addEventListener("click",()=>{
     //Borrow Book sayfasına yönlendirme yapılacak.
     window.location.href="/borrowBook";
   });
 }

 var returnBookButtons=document.querySelectorAll(".returnBook");
 for(var i=0;i<returnBookButtons.length;i++){
   returnBookButtons[i].addEventListener("click",()=>{
     //Return Book sayfasına yönlendirilecek
     window.location.href="/returnBook";
   });
 }

 var currentLoansButtons=document.querySelectorAll(".currentLoans");
 for(var i=0;i<currentLoansButtons.length;i++){
     //Current Loans sayfasına yönlendirilecek
     currentLoansButtons[i].addEventListener("click",()=>{
     window.location.href="/currentLoans";
   });
 }

 document.querySelector("#allBooks").addEventListener("click",()=>{
         //All books sayfasına yönlendirilecek
         window.location.href="/allBooks";
 });

 document.querySelector(".request").addEventListener("click",()=>{
       //Request sayfasına yönlendirilecek.
       window.location.href="/request";
     });
 document.querySelector("#accountbtn").addEventListener("click",()=>{
      window.location.href="/account";
 });
 

 