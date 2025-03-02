import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { isValidEmail } from '@shelf/is-valid-email-address';
import {getCountryFlagEmojiFromCountryCodeOrNameOrFlagEmoji,getCountryFlagEmojiFromCountryCode,getCountryDialCodeFromCountryCodeOrNameOrFlagEmoji,  countries} from "country-codes-flags-phone-codes";


const PORT=3000;
const app=express();
const db = new pg.Client({
        user:"postgres",
        host:"localhost",        
        database:"Aurora Libary",
        password:"osman123",
        port:5432,
});
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


var country=[];
var countryCode=[];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var currentReaderID="";
var currentWorkerID=-1;

/* Helper Functions*/

function createMemberID(){
        var ID="";
        for (var i=0;i<11;i++){
                var temp=Math.floor(Math.random()*10);
                ID=ID+temp;
        }
        return ID;

}
function isNumeric(input) {
        return /^[0-9]+$/.test(input);
    }

async function checkMemberIDExist(ID){
        var validID=false;
        var query= await db.query("SELECT id from reader");
        var result=query.rows;
        for(var i=0;i<result.length;i++){
                if(result[i].id===ID){
                        validID=true;
                        break;
                }
        }
        return validID;
}


async function readerExist(name,password,type){
         var exist=false;
         if(type==="mail"){
                var query=await db.query("SELECT mail,password from reader");
                var result= query.rows;
                for(var i=0;i<result.length;i++){
                        if(result[i].mail===name&&result[i].password===password){
                                exist=true;
                                return exist;
                        }
                }
         }
         else{
                var query=await db.query("SELECT id,password from reader");
                var result= query.rows;
                for(var i=0;i<result.length;i++){
                        if(result[i].id===name&&result[i].password===password){
                                exist=true;
                                return exist;
                        }
                }
         }
         return exist;
}

async function workerExist(name,password,type){
        var exist=false;
         if(type==="mail"){
                var query=await db.query("SELECT mail,password from worker");
                var result= query.rows;
                for(var i=0;i<result.length;i++){
                        if(result[i].mail===name&&result[i].password===password){
                                exist=true;
                                return exist;
                        }
                }
         }
         else{
                var query=await db.query("SELECT id,password from worker");
                var result= query.rows;
                for(var i=0;i<result.length;i++){
                        if(result[i].id==name&&result[i].password===password){
                                exist=true;
                                return exist;
                        }
                }
         }
         return exist;
}

function fillCountryArray(){
        for(var i=0;i<countries.length;i++){
                country.push(countries[i].name);
        }
}

function fillCountryCode(){
        for(var i=0;i<countries.length;i++){
                countryCode.push(countries[i].dialCode);
        }
}

async function getReaderIDByEmail(email){
        var query=await db.query("SELECT id FROM reader where mail=$1",[email]);
        var result=query.rows;
        currentReaderID=result[0].id;
}


function getDate(){
        var day=new Date().getDate();
        var month=months[new Date().getMonth()];
        var year=new Date().getFullYear();
        var date=day+"-"+month+"-"+year;
        return date;
        
}


async function readerHasCurrentLoan(ID){
        var query=await db.query("SELECT count(*) FROM borrow_list where member_id=$1",[ID]);
        var result=query.rows;
        var loanBookAmount=parseInt(result[0].count);
        if(loanBookAmount===0) return false;
        return true;
}

async function getWorkerName_Title_byMail(mail){
        var query= await db.query("SELECT id,name,surname,access_level from worker where mail='"+mail+"';");
        var result=query.rows;
        return result;
      
}

async function getWorkerName_Title_byID(id){
        var query= await db.query("SELECT name,surname,access_level from worker where id=$1;",[id]);
        var result=query.rows;
        return result;
}


async function isAuthorized_byID(id){
        var query=await db.query("SELECT access_level FROM worker where id=$1",[id]);
        var result=query.rows;
        var title=result[0].access_level;
        if(title==="Admin" || title==="Manager") return true;
        return false;
}

async function isAuthorized_byMail(mail){
        var query=await db.query("SELECT access_level FROM worker where mail=$1",[mail]);
        var result=query.rows;
        var title=result[0].access_level;
        if(title==="Admin" || title==="Manager") return true;
        return false;
}

app.listen(PORT,()=>{
        console.log("Port is Running");
        getDate();
        
});


app.get("/",(req,res)=>{
        res.render("index.ejs",{year:new Date().getFullYear()});
});

app.post("/loginOrSignIn",async (req,res)=>{
        const i_select=(req.body.select);
        if(i_select==="login"){
            res.render("login.ejs");
        }
        else{
                await fillCountryArray();
                await fillCountryCode();
                res.render("sign.ejs",{country:country,code:countryCode,year:new Date().getFullYear()});
        }
        

});
app.get("/workermainpage",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized= await isAuthorized_byID(currentWorkerID);
        res.render("worker/workerpage.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,display:isAuthorized});
});


app.get("/sign",async(req,res)=>{
        var query=await db.query("SELECT name,surname from reader where id=$1",[currentReaderID]);
        var result=query.rows;
        const readerFirstName=result[0].name;
        const readerLastName=result[0].surname;
        res.render("userpage.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName});
});

app.post("/sign",async (req,res)=>{
       
        if(req.body.executiveName){
                /*Executive login*/
                
                const i_name=req.body.executiveName;
                const i_password=req.body.executivePassword;
                var validEmail =  isValidEmail(i_name);
                if(validEmail){
                        var foundWorker= await workerExist(i_name,i_password,"mail");
                        if(foundWorker){
                                var info= await getWorkerName_Title_byMail(i_name);
                                var name=info[0].name+" "+info[0].surname;
                                var title=info[0].access_level;
                                var id=info[0].id;
                                currentWorkerID=parseInt(id);
                                var isAuthorized=await isAuthorized_byMail(i_name);
                                res.render("worker/workerpage.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,display:isAuthorized});
                        }
                        else{
                                res.render("login.ejs",{exeError:"Mail or password is wrong Try Again!"}); 
                        }
                }

                else{
                        var info=await getWorkerName_Title_byID(i_name);
                        var name=info[0].name+" "+info[0].surname;
                        var title=info[0].access_level;
                        currentWorkerID=parseInt(i_name);
                        var foundWorker= await workerExist(i_name,i_password,"password");
                        if(foundWorker){
                                var isAuthorized=await isAuthorized_byID(i_name);
                                res.render("worker/workerpage.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,display:isAuthorized});
                        }
                        else{
                                res.render("login.ejs",{exeError:"ID or password is wrong Try Again!"});
                        } 
                }
        }
        else if(req.body.readerName){
                //Reader Login
                const i_name=req.body.readerName;
                const i_password=req.body.readerPassword;
                var validEmail =  isValidEmail(i_name);
                if(validEmail){
                        var foundUser= await readerExist(i_name,i_password,"mail");
                        if(foundUser){
                               await getReaderIDByEmail(i_name);
                                var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
                                var result=query.rows;
                                var readerID=result[0].id;
                                var readerFirstName=result[0].name;
                                var readerLastName=result[0].surname;
                                res.render("userpage.ejs",{id:readerID,name:readerFirstName+" "+readerLastName});
                        }
                        else{
                                res.render("login.ejs",{readError:"Mail or password is wrong Try Again!"});
                        }
                }
                else{
                        var foundUser= await readerExist(i_name,i_password,"password");
                        if(foundUser){
                                currentReaderID=i_name;
                                var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
                                var result=query.rows;
                                var readerID=result[0].id;
                                var readerFirstName=result[0].name;
                                var readerLastName=result[0].surname;
                                res.render("userpage.ejs",{id:readerID,name:readerFirstName+" "+readerLastName});

                        }
                        else{
                                res.render("login.ejs",{readError:"ID or password is wrong Try Again!"});
                        } 
                }
        }
        else{
                res.render("login.ejs",{error:"Please Enter your login details!"});
        }

});




app.post("/formResult",async(req,res)=>{
                var ID=createMemberID();
                var ID_Exist=checkMemberIDExist(ID);
                if(ID_Exist){
                        while(!ID_Exist){
                                ID=createMemberID();
                                ID_Exist=checkMemberIDExist(ID);
                        }
                }
                
                
                var today = new Date();
                var date = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();
                const i_first_name=req.body.firstName;
                const i_last_name=req.body.lastName;
                const i_phone=req.body.countryCode+req.body.number;
                const i_mail=req.body.mail;
                const i_password=req.body.password;
                const i_address=req.body.address;
                const i_gender=req.body.gender;

                var record=[ID,
                        i_first_name,
                        i_last_name,
                        i_phone,
                        i_mail,
                        i_address,
                        date,
                        i_password,
                        i_gender
                ];

                try{
                        await db.query("INSERT INTO reader values($1,$2,$3,$4,$5,$6,$7,$8,$9)",record);
                        res.render("successful.ejs",{name:i_first_name,id:ID});
                        
                }
                catch(error){
                        res.status(500).json({message:error.message});
                }

                

});


app.get("/login",(req,res)=>{
                res.render("login.ejs");

});


app.get("/borrowBook",async(req,res)=>{
        var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
                                var result=query.rows;
                                var readerFirstName=result[0].name;
                                var readerLastName=result[0].surname;
        query=await db.query("SELECT distinct author from book;");
                result=query.rows;
                var author=[];
                for(var i=0;i<result.length;i++){author.push(result[i].author);}
        query=await db.query("SELECT distinct type from book;");
                result=query.rows;
                var type=[];
                for(var i=0;i<result.length;i++){type.push(result[i].type);}
        query=await db.query("SELECT id,name,author,type,pages from book where amount>0");
                result=query.rows;
                                res.render("borrowbook.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,author:author,type:type,data:result});
});


app.post("/borrow",async(req,res)=>{
                const i_book_id=parseInt(req.body.selectedBookID);
                var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
                          var result=query.rows;
                        var readerFirstName=result[0].name;
                        var readerLastName=result[0].surname;
                try{
                        query=await db.query("SELECT count(*) from borrow_list where member_id=$1;",[currentReaderID]);
                        result=query.rows;
                        var currentLoanAmount=parseInt(result[0].count);
                        if(currentLoanAmount<5){
                        query= await db.query("SELECT name from book where id=$1",[i_book_id]);
                        result=query.rows;
                        const book_name=result[0].name;
                        var date=await getDate();
                        await db.query("INSERT INTO borrow_list (member_id,book_id,borrow_date) values($1,$2,$3);",[currentReaderID,i_book_id,date]);
                        await db.query("INSERT INTO borrow_history (member_id,book_id,borrow_date) values($1,$2,$3);",[currentReaderID,i_book_id,date]);
                        await db.query("UPDATE book set amount=amount-1 where id=$1",[i_book_id]);
                        res.render("userSuccessful.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,book:book_name});
                        }
                        else{
                                var text="You can borrow up to 5 books. If you want to borrow a new one, please return a book first."
                                res.render("userSuccessful.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,message:text});   
                        }
                }
                catch(error){
                        res.render("userSuccessful.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName});
                }

});


app.post("/filterbooks",async (req,res)=>{
        const i_book_name=req.body.name.toLowerCase();
        const i_author_name=req.body.authorName;
        const i_book_type=req.body.bookType;
        var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
                                var result=query.rows;
                                var readerFirstName=result[0].name;
                                var readerLastName=result[0].surname;
        var statement="SELECT id,name,author,type,pages from book where amount>0";
        if(!(i_author_name==="default")){
                statement=statement+" and author='"+i_author_name+"'";
        }
        if(!(i_book_type==="default")){
                statement=statement+" and type='"+i_book_type+"'";
        } 

        if (!(/^\s*$/.test(i_book_name))) {
         statement = statement + " and LOWER(name) like '%" + i_book_name + "%'";

        }
        
        query=await db.query("SELECT distinct author from book;");
        result=query.rows;
        var author=[];
        for(var i=0;i<result.length;i++){author.push(result[i].author);}
        query=await db.query("SELECT distinct type from book;");        
        result=query.rows;
        var type=[];
        for(var i=0;i<result.length;i++){type.push(result[i].type);}
       
        query=await db.query(statement);
        result=query.rows;

        res.render("borrowbook.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,author:author,type:type,data:result});
});


app.get("/allBooks",(req,res)=>{
        res.redirect("/borrowBook")
});



app.get("/returnBook",async (req,res)=>{
        var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
        var result=query.rows;
        var readerFirstName=result[0].name;
        var readerLastName=result[0].surname;
        query=await db.query("SELECT book.id,book.name,book.author,book.type,borrow_list.borrow_date FROM borrow_list JOIN book on borrow_list.book_id=book.id where member_id='"+currentReaderID+"';");
        result=query.rows;
        res.render("returnBook.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,data:result});
});



app.post("/returnBook",async(req,res)=>{
        const i_returnBook_ID=parseInt(req.body.selectedBook);
        await db.query("UPDATE book set amount=amount+1 where id=$1",[i_returnBook_ID]);
        const today_date=getDate();
        await db.query("UPDATE borrow_history set return_date=$1 where member_id=$2 and book_id=$3;",[today_date,currentReaderID,i_returnBook_ID]);
        await db.query("DELETE FROM borrow_list where member_id=$1 and book_id=$2",[currentReaderID,i_returnBook_ID]);
       var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
        var result=query.rows;
        var readerFirstName=result[0].name;
        var readerLastName=result[0].surname;
        query=await db.query("SELECT book.id,book.name,book.author,book.type,borrow_list.borrow_date FROM borrow_list JOIN book on borrow_list.book_id=book.id where member_id='"+currentReaderID+"';");
        result=query.rows;
        res.render("returnBook.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,data:result});
});



app.get("/currentLoans",(req,res)=>{
        res.redirect("/returnBook");
});


app.get("/borrowHistory",async(req,res)=>{
        var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
        var result=query.rows;
        var readerFirstName=result[0].name;
        var readerLastName=result[0].surname;
        query=await db.query("SELECT book.name,book.author,book.type,borrow_history.borrow_date, borrow_history.return_date FROM borrow_history JOIN book on book.id=borrow_history.id where member_id='"+currentReaderID+"' ORDER BY TO_DATE(borrow_date, 'DD-Month-YYYY') ASC;");
        result=query.rows;
        res.render("returnBook.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,history_data:result});
});



app.get("/request",async(req,res)=>{
        var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
        var result=query.rows;
        var readerFirstName=result[0].name;
        var readerLastName=result[0].surname;
        res.render("userForm.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName})


});


app.post("/feedback",async(req,res)=>{
                const i_topic=req.body.topic;
                const i_message=req.body.message;
                var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
                        var result=query.rows;
                        var readerFirstName=result[0].name;
                        var readerLastName=result[0].surname;                
                if ((/^\s*$/.test(i_topic))) {                       
                        var error="Error: Topic sentence is required. Please enter a valid topic sentence to proceed. ❌"; 
                        res.render("userSuccessful.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,message:error});
                        return;
                        
                }
                if((/^\s*$/.test(i_message))){
                        var error="Error: Message is required. Please enter a message to proceed. ❌";
                        res.render("userSuccessful.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,message:error});         
                        return;
                }
                await db.query("INSERT INTO feedback (topic,message,reader_id) values($1,$2,$3);",[i_topic,i_message,currentReaderID]);
                var text="Thank you for your time,the feedback message has been received and will be taken into consideration 🙏."
                res.render("userSuccessful.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,message:text});
                
});



app.get("/account",async(req,res)=>{
                await fillCountryArray();
                await fillCountryCode();
                var query=await db.query("SELECT * FROM reader where id=$1;",[currentReaderID]);
                query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
                var result=query.rows;
                var readerFirstName=result[0].name;
                var readerLastName=result[0].surname;
                 result=query.rows;
                res.render("sign.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,country:country,code:countryCode,year:new Date().getFullYear(),data:result});
});



app.post("/deleteAcc",async(req,res)=>{
       const i_deleteAccountID=(req.body.deleteUserID);
       var condition=await readerHasCurrentLoan(i_deleteAccountID);
       var query=await db.query("SELECT * FROM reader where id=$1",[currentReaderID]);
                        var result=query.rows;
                        var readerFirstName=result[0].name;
                        var readerLastName=result[0].surname; 
        
        if(condition){
        var text="Before deleting your account, you need to return the books you have borrowed.";        
        res.render("userSuccessful.ejs",{id:currentReaderID,name:readerFirstName+" "+readerLastName,message:text});
        }
        else{
                await db.query("DELETE FROM borrow_history where member_id=$1",[i_deleteAccountID]);
                await db.query("DELETE FROM feedback where reader_id=$1",[i_deleteAccountID]);
                await db.query("DELETE FROM reader where id=$1",[i_deleteAccountID]);
                
                var text="Account deleted, Hope to see you again soon "+readerFirstName+".";
                res.render("deleteuseracc.ejs",{message:text});
        }
});
app.post("/formUpdate",async (req,res)=>{
        var query=await db.query("SELECT *FROM reader where id=$1",[currentReaderID]);
        var result=query.rows;
        const new_firstname=(/^\s*$/.test(req.body.firstName))?result[0].name:req.body.firstName;
        const new_lastname=(/^\s*$/.test(req.body.lastName))?result[0].surname:req.body.lastName;
        const new_number=(/^\s*$/.test(req.body.number))?result[0].phone:req.body.countryCode+req.body.number;
        const new_mail=(/^\s*$/.test(req.body.mail))?result[0].mail:req.body.mail;
        const new_password=(/^\s*$/.test(req.body.password))?result[0].password:req.body.password;
        const new_address=(/^\s*$/.test(req.body.address))?result[0].address:req.body.address;
        const new_gender=req.body.gender;
        await db.query("UPDATE reader set name=$1,surname=$2,phone=$3,mail=$4, password=$5,address=$6,gender=$7 where id=$8",
                [new_firstname,new_lastname,new_number,new_mail,new_password,new_address,new_gender,currentReaderID]
        );
        var text="Your account information has been updated!"
        res.render("userSuccessful.ejs",{id:currentReaderID,name:new_firstname+" "+new_lastname,message:text});
});


app.get("/getReaders",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var query=await db.query("SELECT * FROM reader ");
        var isAuthorized= await isAuthorized_byID(currentWorkerID);
        var result=query.rows;
        res.render("worker/displayReader.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,display:isAuthorized});

});

app.post("/searchUser",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        const i_name=(req.body.readerName).toLowerCase();
        var query=await db.query("SELECT * FROM reader WHERE LOWER(CONCAT(name, ' ', surname)) LIKE '%"+i_name+"%';");
        var result=query.rows;
        res.render("worker/displayReader.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result});
});


app.post("/deletereader",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var deleteAccountID=(req.body.deleteReaderID);
        var condition= await readerHasCurrentLoan(deleteAccountID);
        if(condition){
                var text="A reader cannot be deleted before returning their books!";
                res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,message:text});
        }
        else{
                var query=await db.query("SELECT name,surname FROM reader where id=$1",[deleteAccountID]);
                var result=query.rows;
                var name=result[0].name+" "+result[0].surname;
                await db.query("DELETE FROM borrow_history where member_id=$1",[deleteAccountID]);
                await db.query("DELETE FROM feedback WHERE reader_id=$1",[deleteAccountID]);
                await db.query("DELETE FROM reader where id=$1",[deleteAccountID]);
                var text=name+" has been deleted successfully!"
                res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,message:text});
                
        }

});


app.get("/getFeedbacks",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var query=await db.query("SELECT feedback.id, feedback.topic,feedback.message,reader.name,reader.surname FROM feedback JOIN reader ON reader.id=feedback.reader_id ORDER BY feedback.id DESC");
        var result=query.rows;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        res.render("worker/displayFeedback.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,display:isAuthorized});
});

app.post("/deleteFeedBack",async(req,res)=>{
        const FeedbackId=(req.body.feedbackID);
        await db.query("DELETE FROM feedback where id=$1",[FeedbackId]);
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var text="Feedback that its ID="+FeedbackId+" was deleted";
        res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,message:text});
});


app.post("/searchFeedback",async(req,res)=>{
        const i_reader_name=(req.body.readerName);
        var query=await db.query("SELECT feedback.id, feedback.topic,feedback.message,reader.name,reader.surname FROM feedback JOIN reader ON reader.id=feedback.reader_id WHERE LOWER(CONCAT(reader.name,' ',reader.surname)) like '%"+i_reader_name.toLowerCase()+"%'");
        var result=query.rows;
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        res.render("worker/displayFeedback.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,display:isAuthorized});
});

app.get("/getBorrowHistory",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var query=await db.query("SELECT book.name,book.author,book.type,borrow_history.borrow_date, borrow_history.return_date,CONCAT(reader.name,' ',reader.surname) as fullname FROM borrow_history JOIN book on book.id=borrow_history.book_id JOIN reader ON reader.id=borrow_history.member_id ORDER BY TO_DATE(borrow_date, 'DD-Month-YYYY') ASC;");
        var result=query.rows;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        var text_title="Borrow History";
        res.render("worker/borrow.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,title:text_title,display:isAuthorized});
});

app.get("/getCurrentLoans",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var query=await db.query("SELECT reader.id,CONCAT(reader.name,' ',reader.surname) as fullname,book.name,book.author,book.type,borrow_list.borrow_date FROM borrow_list JOIN book ON book.id=borrow_list.book_id JOIN reader ON reader.id=borrow_list.member_id");
        var result=query.rows;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        var text_title="Current Borrow List";
        res.render("worker/borrow.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,title:text_title,current:true,display:isAuthorized});
});


app.get("/getBooks",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        var query=await db.query("SELECT * FROM book order by id asc;");
        var result=query.rows;
        res.render("worker/displayBook.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,display:isAuthorized});
});


app.post("/searchBook",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        var i_book_name=req.body.bookName.toLowerCase();
        var query=await db.query("SELECT * FROM book where LOWER(name) like '%"+i_book_name+"%';");
        var result=query.rows;
        res.render("worker/displayBook.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,display:isAuthorized});
        
});


app.post("/update",async(req,res)=>{
                const i_book_id=parseInt(req.body.bookID);
                const i_book_amount=Math.ceil(parseInt(req.body.amount));
                const valid_amount = Number.isInteger(i_book_amount);
                const i_operation=req.body.operation;
                if(valid_amount){
                        if(i_operation==="add"){
                                await db.query("UPDATE book set amount=amount+$1 where id=$2",[i_book_amount,i_book_id]);
                                res.redirect("/getBooks");
                        }
                        else{
                               
                               var query=(await db.query("SELECT amount from book where id=$1",[i_book_id]));
                               var current_amount=query.rows[0].amount;
                           
                                if(current_amount<i_book_amount){
                                        var info=await getWorkerName_Title_byID(currentWorkerID);
                                        var name=info[0].name+" "+info[0].surname;
                                        var title=info[0].access_level;
                                        var isAuthorized=await isAuthorized_byID(currentWorkerID);
                                        var text="There is not enough book to remove please enter valid number";
                                        res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,message:text,display:isAuthorized});
                                }
                                else{
                                        await db.query("UPDATE book set amount=amount-$1 where id=$2",[i_book_amount,i_book_id]);
                                        res.redirect("/getBooks");
                                }
                        }
                }
                else{
                        var info=await getWorkerName_Title_byID(currentWorkerID);
                                        var name=info[0].name+" "+info[0].surname;
                                        var title=info[0].access_level;
                                        var isAuthorized=await isAuthorized_byID(currentWorkerID);
                                        var text="Please enter valid number to remove or add";
                                        res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,message:text,display:isAuthorized});
                }

});

app.get("/addBook",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        res.render("worker/addBook.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,display:isAuthorized});
});



app.post("/bookInfo",async(req,res)=>{
        const i_bookName=req.body.bookName;
        const i_authorName=req.body.authorName;
        const i_bookType=req.body.bookType;
        var i_bookPage=(req.body.bookPage);
        var i_bookAmount=(req.body.bookAmount);
        var validBookPage=false;
        var validBookAmount=false;
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        
        if(isNumeric(i_bookPage) ){
                i_bookPage=parseInt(i_bookPage);
                if(i_bookPage>0){
                        validBookPage=true;
                }
        }
        if(isNumeric(i_bookAmount) ){
                i_bookAmount=parseInt(i_bookAmount);
                if(i_bookAmount>0){
                        validBookAmount=true;
                }
        }
        if(!(validBookAmount && validBookPage)){
                var text="Page number or Book amount or both of them are not valid !";
                res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,display:isAuthorized,message:text});
        }
        else{
                var text=i_bookName+" was successfuly added into libary!";
                await db.query("INSERT INTO book (name,author,type,pages,amount) values($1,$2,$3,$4,$5)",[i_bookName,i_authorName,i_bookType,i_bookPage,i_bookAmount]);
                res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,display:isAuthorized,message:text});
        }
});


app.get("/getWorkers",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        var query=await db.query("SELECT * FROM worker");
        var result=query.rows;
        res.render("worker/displayWorker.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,display:isAuthorized});

});

app.post("/searchWorker",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        const i_worker_name=req.body.workerName.toLowerCase();
        var query=await db.query("SELECT * FROM worker where LOWER(CONCAT(name,surname)) like '%"+i_worker_name+"%';");
        var result=query.rows;
        res.render("worker/displayWorker.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,display:isAuthorized});
});


app.post("/updateWorker",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        const i_operation=req.body.operation;
        const i_worker_id=parseInt(req.body.workerID);
        if(i_operation==="update"){
                var query=await db.query("SELECT * FROM worker where id=$1",[i_worker_id]);
                var result=query.rows;
                var text="Worker Update";
                var btnName="UPDATE";
                res.render("worker/workerUpdate.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,title:text,display:isAuthorized,btnName:btnName});
        }
        else{
               var query=await db.query("SELECT CONCAT(name,' ',surname) as fullname from worker where id=$1",[i_worker_id]);
               var name_deleted=query.rows[0].fullname;
                await db.query("DELETE FROM worker where id=$1",[i_worker_id]);
               var text="Worker "+name_deleted+", has been Successfuly fired!";
               res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,display:isAuthorized,message:text});

        }
        
});

app.post("/workerUpdateResult",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        const i_worker_id=parseInt(req.body.workerID);
        const i_worker_name=req.body.workerName;
        const i_worker_surname=req.body.workerSurname;
        const i_worker_title=req.body.title;
        const i_worker_mail=req.body.mail;
        const i_worker_phone=req.body.phone;
        var input_array=[i_worker_name,i_worker_surname,i_worker_title,i_worker_mail,i_worker_phone];
        var validInputs=true;
        for (var i=0;i<input_array.length;i++){
                if((/^\s*$/.test(input_array[i]))){
                        validInputs=false;
                        break;
                }

        }
        if(!validInputs){
                var text="Wrong input please enter valid inputs!";
                res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,display:isAuthorized,message:text});
        }
        else{
                await db.query("UPDATE worker set name=$1,surname=$2,mail=$3,phone=$4,access_level=$5 where id=$6",[
                i_worker_name,i_worker_surname,i_worker_mail,i_worker_phone,i_worker_title,i_worker_id
                ]);
                res.redirect("/getWorkers");
        }


        
});
app.get("/addWorker",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        var text="Add Worker"
        var btnName="ADD";
        res.render("worker/workerUpdate.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,title:text,display:isAuthorized,btnName:btnName});
});

app.post("/workerAddResult",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);
        const i_worker_name=req.body.workerName;
        const i_worker_surname=req.body.workerSurname;
        const i_worker_title=req.body.title;
        const i_worker_mail=req.body.mail;
        const i_worker_phone=req.body.phone;
        const i_worker_password=req.body.password;
        var input_array=[i_worker_name,i_worker_surname,i_worker_title,i_worker_mail,i_worker_phone,i_worker_password];
        var validInputs=true;
        for (var i=0;i<input_array.length;i++){
                if((/^\s*$/.test(input_array[i]))){
                        validInputs=false;
                        break;
                }

        }
        if(!validInputs){
                var text="Wrong input please enter valid inputs!";
                res.render("worker/workersuccessful.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,display:isAuthorized,message:text});
        }
        else{
                await db.query("INSERT INTO worker (name,surname,mail,phone,password,access_level) values ($1,$2,$3,$4,$5,$6);",[
                        i_worker_name,i_worker_surname,i_worker_mail,i_worker_phone,i_worker_password,i_worker_title
                ]);
                res.redirect("/getWorkers");
        }
});

app.post("/searchReader",async(req,res)=>{
        var info=await getWorkerName_Title_byID(currentWorkerID);
        var name=info[0].name+" "+info[0].surname;
        var title=info[0].access_level;
        var isAuthorized=await isAuthorized_byID(currentWorkerID);        
        const i_reader_name=req.body.readerName.toLowerCase();
        var text_title=req.body.title ; 

        var query,result;
        if(text_title==="Borrow History"){
                var query=await db.query("SELECT book.name,book.author,book.type,borrow_history.borrow_date, borrow_history.return_date,CONCAT(reader.name,' ',reader.surname) as fullname FROM borrow_history JOIN book on book.id=borrow_history.book_id JOIN reader ON reader.id=borrow_history.member_id where  LOWER(CONCAT(reader.name,reader.surname)) like '%"+i_reader_name+"%' ORDER BY TO_DATE(borrow_date, 'DD-Month-YYYY') ASC;");
                var result=query.rows;
        }
        else{
                var query=await db.query("SELECT reader.id,CONCAT(reader.name,' ',reader.surname) as fullname,book.name,book.author,book.type,borrow_list.borrow_date FROM borrow_list JOIN book ON book.id=borrow_list.book_id JOIN reader ON reader.id=borrow_list.member_id WHERE LOWER(CONCAT(reader.name,reader.surname)) like '%"+i_reader_name+"%'");
                var result=query.rows;  
        }
                
            
        res.render("worker/borrow.ejs",{name:name+"-"+title,id:"ID:"+currentWorkerID,data:result,title:text_title,display:isAuthorized});
});