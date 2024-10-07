const express=require("express");
const mongoose=require("mongoose");
const app=express();
const port=8080;
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
app.use(methodOverride('_method'));
const Listing=require("./models/listing.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema}=require("./schema.js");

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,"./public")));
app.engine("ejs",ejsMate);

main()
.then(()=>{
    console.log("Connected to DB...");
}).catch((err)=>{
    console.log(err);
});
async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/wandarlust");
}


//Routes
app.get("/",(req,res)=>{
    // res.send("Hi, iam root !");
    res.redirect("/listings");
});

// app.get("/testListing",async (req,res)=>{
//     let sampleListing=new Listing({
//         title:"My New Villa",
//         description: "By the Beach",
//         price:1200,
//         location:"Calungute, Goa",
//         country:"India",
//     });
//     await sampleListing.save().then(()=>{console.log();}).catch((err)=>{console.log(err);});
//     console.log("sample was saved");
//     res.send("sucesful testing");
// });


const validateListing=(req,res,next)=>{
    // Validate req.body against the schema
    const { error } = listingSchema.validate({ listing: req.body.listing });
    if (error) {
        // Handle validation error
        // error=error.map((el)=>el.message.join(",")); //if it is array
        return next(new ExpressError(400, error.details[0].message));
    }
    next();
}

//Index Route
app.get("/listings",wrapAsync(async (req,res)=>{
    const allListings=await Listing.find({});
    res.render("./listings/index.ejs",{ allListings });
}));

//Create Route
app.get("/listings/new",(req,res)=>{
    res.render("./listings/new.ejs");
});

//Add Route
app.post("/listings", validateListing,wrapAsync(async (req, res, next) => {

    let newListing = new Listing(req.body);
    await newListing.save();
    res.redirect("/listings");
}));


//Show Route
app.get("/listings/:id",wrapAsync(async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    // console.log(listing);
    res.render("./listings/show.ejs",{ listing });
}));

//Edit route
app.get("/listings/:id/edit",wrapAsync(async (req,res)=>{
    let {id}=req.params;
    let listing=await  Listing.findById(id);
    // console.log(listing);
    res.render("./listings/edit.ejs",{listing});
}));

//PUT request to update
app.put("/listings/:id",validateListing ,wrapAsync(async (req,res)=>{
    const listing=req.body.listing;
    let {id}=req.params;
    // Listing.findByIdAndUpdate(id,{...listing}); //this is use of deconstructor...
    console.log(listing);
    // console.log(id);
    await Listing.findByIdAndUpdate(id,listing);
    // res.send("ok check console");
    res.redirect("/listings/"+id);
}));

//DELETE route
app.delete("/listings/:id",wrapAsync(async (req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
    console.log(deletedListing);
}));


//hANDLE ALL MISSING ROUTES
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});




//Error Handling MiddleWare FOR DATABASE ERROR ASYNC
app.use((err, req, res, next) => {
    const { status= 500, message = "Something went wrong" } = err;
    // res.status(status).send(message);
    res.render("listings/error.ejs",{message});
});



//Act when unavailable page got request
app.use((req, res, next) => {
    res.status(404).send("Sorry, the page you are looking for does not exist!");
});



app.listen(port,()=>{
    console.log("app is listining at port 8080...");
});