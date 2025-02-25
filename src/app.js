const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const sharp = require('sharp')
const crypto = require("crypto");
const port = process.env.PORT || 8000;
const cookieParser = require("cookie-parser");
const fs = require("fs");
// const bcrypt = require("bcryptjs");
const multer = require("multer");
const getTime = require("./models/getTime");
const { day, month, year, hours, mins, a } = getTime();
console.log(__dirname);

const Register = require("./models/registerAlumni");
const AdmRegister = require("./models/registerInstAdmin");
const HeadRegister = require("./models/registerHeadAdmin");
const PreRegister = require('./models/preRegisterAlumni')
const { title } = require("process");
const Complaint = require("./models/complaint");
const InstComplaint = require("./models/instComplaint");
const Query = require("./models/queries");
const Post = require("./models/posts");

app.use(cookieParser());
app.set("view engine", "hbs");
require("./db/conn");
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("views", path.join(__dirname, "/template/views"));
const partialsPath = path.join(__dirname, "./template/partials/");
const staticPath = path.join(__dirname, "/template/");

hbs.registerHelper("eq", function (a, b) {
  return a === b;
});

app.use(express.static(staticPath));
hbs.registerPartials(partialsPath);

const tokenStore = new Map();
const Profilestorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profileimgs/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension (.jpg, .png)
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`); // Temporary name
  },
});
const Poststorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/posts/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension (.jpg, .png)
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`); // Temporary name
  },
});
const uploadprofile = multer({ storage: Profilestorage });
const uploadpost = multer({ storage: Poststorage });
//
//
//
//
//
//
//
//
app.get("/", (req, res) => {
  res.render("loginalumni", {});
});
app.post("/", async (req, res) => {
  try {
    const { rollno, password } = req.body;
    const roll = rollno.trim().replace(/\s+/g, "");
    const pass = password.trim().replace(/\s+/g, "");
    const user = await Register.findOne({ rollno: roll, password: pass });
    if (!user) {
      return res.render("loginalumni", {
        warn: `Invalid Credentials`,
      });
    }

    // const passwordAuth = await bcrypt.compare(password, user.password);
    const passwordAuth = user.password === pass;

    if (!passwordAuth) {
      return res.render("loginalumni", {
        warn: "Invalid Credentials",
      });
    }
    if (user.status === "Approved") {
      const token = crypto.randomBytes(16).toString("hex");
      tokenStore.set(token, roll);
      res.cookie("userToken", token, { maxAge: 3600000, httpOnly: true });
      console.log("Login Success");
      return res.redirect("/home");
    } else if (user.status === "Pending") {
      return res.render("loginalumni", {
        warn: "Application Pending ",
      });
    } else {
      return res.render("loginalumni", {
        warn: "Account status not recognized. Please contact support.",
      });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.render("loginalumni", {
      warn: "An error occurred during login. Please try again later.",
    });
  }
});

//
//
//
//
//
//
//
//
app.get("/registertest", async (req, res) => {
  res.render("preregisteralumni");
});
app.post('/registertest', async (req, res) => {
  let { rollno, regdno, batch, name } = req.body;
  const namecap = name.toUpperCase();
  regdno = parseInt(regdno, 10);

  const VerifyAlumniCount = await PreRegister.countDocuments({
    name: namecap,
    rollno: rollno,
    regno: regdno,
    batch: batch
  });

  if (VerifyAlumniCount > 0 && VerifyAlumniCount < 2) {
    const nameToken = crypto.randomBytes(16).toString("hex");
    const rollnoToken = crypto.randomBytes(16).toString("hex");
    const batchToken = crypto.randomBytes(16).toString("hex");
    const verifyToken = crypto.randomBytes(16).toString("hex");

    tokenStore.set(nameToken, namecap);
    tokenStore.set(rollnoToken, rollno);
    tokenStore.set(batchToken, batch);
    tokenStore.set(verifyToken, "Verified");

    res.cookie("nameToken", nameToken, { maxAge: 3600000, httpOnly: true });
    res.cookie("rollnoToken", rollnoToken, { maxAge: 3600000, httpOnly: true });
    res.cookie("batchToken", batchToken, { maxAge: 3600000, httpOnly: true });
    res.cookie("verifyToken", verifyToken, { maxAge: 3600000, httpOnly: true });

    res.redirect(`/register?nameValue=${name}&rollnoValue=${rollno}&batchValue=${batch}`);
  } else {
    res.render('preregisteralumni', {
      warn: "Not Verified as an Alumni"
    });
  }
});


//
//
//
//
//
//



app.get("/register", (req, res) => {
  res.render("registeralumni");
});

app.post("/register", uploadprofile.single("profileimg"), async (req, res) => {
  const nametoken = tokenStore.get(req.cookies.nameToken) || "";
  const rollnotoken = tokenStore.get(req.cookies.rollnoToken) || "";
  const batchtoken = tokenStore.get(req.cookies.batchToken) || "";
  const verifytoken = tokenStore.get(req.cookies.verifyToken) || "";
  const {
    name,
    rollno,
    batch,
    branch,
    skill,
    password,
    cPassword,
    mobno,
    mailid,
    village,
    post,
    pincode,
    block,
    district,
    state,
    cgpa,
  } = req.body;
  const pass = password.trim().replace(/\s+/g, "");
  const cpass = cPassword.trim().replace(/\s+/g, "");
  try {
    if (
      !name ||
      !rollno ||
      !batch ||
      !password ||
      !branch ||
      !cPassword ||
      !mobno ||
      !mailid ||
      !village ||
      !post ||
      !pincode ||
      !block ||
      !district ||
      !state ||
      !cgpa
    ) {
      return res.render("registeralumni", {
        warn: "Please fill out all fields",
      });
    } else {
      if (pass != cpass) {
        return res.render("registeralumni", {
          warn: "Passwords do not match.",
        });
      } else {
        const roll = rollno.trim().replace(/\s+/g, "");
        const checkRollCount = await Register.countDocuments({ rollno: roll });
        if (checkRollCount > 0) {
          return res.render("registeralumni", {
            warn: "Already Registered or Request is still Pending.",
          });
        } else {
          // const hashedPassword = await bcrypt.hash(password, 10);
          let profileImgPath = null;
          if (req.file) {
            const tempPath = req.file.path;
            const ext = path.extname(req.file.originalname);
            const newFileName = `${roll}-profile_img${ext}`;
            const newFilePath = path.join("uploads/profileimgs/", newFileName);

            // Compress and save image
            sharp(tempPath)
              .resize({ width: 500 }) // Resize width to 500px (adjust as needed)
              .jpeg({ quality: 70 }) // Adjust quality (0-100)
              .toFile(newFilePath, (err, info) => {
                if (err) {
                  console.error("Error compressing image:", err);
                } else {
                  console.log("Image compressed successfully:", info);
                }
              });

            profileImgPath = newFilePath;
          }

          const registerAlumni = new Register({
            name: name.trim().toUpperCase(),
            rollno: rollno.trim().replace(/\s+/g, ""),
            batch: batch,
            branch: branch,
            skill: skill.toUpperCase(),
            cgpa: cgpa,
            password: pass,
            mobno: {
              mobno: mobno,
              access: "public",
            },
            mailid: mailid.trim().toLowerCase(),
            address: {
              district: district.trim().toUpperCase(),
              block: block.trim().toUpperCase(),
              state: state.trim().toUpperCase(),
              post: post.trim().toUpperCase(),
              village: village.trim().toUpperCase(),
              pincode: pincode.trim(),
            },
            profileimg: profileImgPath || "uploads/profileimgs/default.jpg",
            status: verifytoken === "Verified" ? "Approved" : "Pending",
          });
          if (!nametoken && !batchtoken && !rollnotoken && !verifytoken) {
            const registered = await registerAlumni.save();
            console.log(registered);
            res.render("registeralumni", {
              success:
                "Application Sent to Admin for Approval. Try logging in after 24 Hours",
            });
          }
          else {
            if (nametoken === name && batchtoken === batch && rollnotoken === rollno) {
              await registerAlumni.save();
              res.render('registeralumni', {
                success: "Registration Successfull. Try Logging in to your account."
              })
            } else {
              return res.render("registeralumni", {
                warn: "Data Mismatch! Please recheck your details.",
              });
            }
          }
        }
      }
    }

  } catch (err) {
    console.log(err);
    res.render("registeralumni", {
      warn: "An error occurred during registration. Please try again.",
    });
  }
});

//
//
//
//
//
//
//
//

app.get("/home", async (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    const noposts = await Post.countDocuments({ rollno: rollno });
    const user = await Register.findOne(
      { rollno: rollno, status: "Approved" },
      {
        _id: 1,
        rollno: 1,
        name: 1,
        profileimg: 1,
        batch: 1,
        branch: 1,
        skill: 1,
        mobno: 1,
        cgpa: 1,
        mailid: 1,
        address: 1,
        servicetype: 1,
        company: 1
      }
    );
    const addressString = `${user.address.village}, ${user.address.post}, ${user.address.block}, ${user.address.district}, ${user.address.pincode}, ${user.address.state}`;
    const userPost = await Post.find(
      {},
      {
        rollno: 1,
        dateandtime: 1,
        head: 1,
        text: 1,
        postimage: 1,
        comments: 1,
      }
    );
    userPost.sort((a, b) => {
      const dateA = new Date(
        `${a.dateandtime.year}-${a.dateandtime.month}-${a.dateandtime.day} ${a.dateandtime.hours}:${a.dateandtime.mins} ${a.dateandtime.a}`
      );
      const dateB = new Date(
        `${b.dateandtime.year}-${b.dateandtime.month}-${b.dateandtime.day} ${b.dateandtime.hours}:${b.dateandtime.mins} ${b.dateandtime.a}`
      );

      return dateB - dateA;
    });

    res.status(201).render("dashboard", {
      pri: user.profileimg,
      name: user.name,
      rollno: user.rollno,
      batch: user.batch,
      branch: user.branch,
      skill: user.skill,
      cgpa: user.cgpa,
      mobno: user.mobno,
      mailid: user.mailid,
      address: addressString,
      ui: user._id,
      company: user.company,
      servicetype: user.servicetype,
      posts: userPost,
      noposts: noposts,
    });
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//
//
//
//
app.get("/alumni", (req, res) => {
  res.render("findalumni");
});

app.post("/alumni", async (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    const { getrollno } = req.body;
    const Alumnitoken = crypto.randomBytes(16).toString("hex");
    tokenStore.set(Alumnitoken, getrollno);
    res.cookie("Alumnitoken", Alumnitoken, { maxAge: 3600000, httpOnly: true });
    res.redirect("/alumnidata");
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//
//
//
//
app.get("/alumnidata", async (req, res) => {
  const getrollnotoken = req.cookies.Alumnitoken;
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);

    if (tokenStore.has(getrollnotoken)) {
      const getrollno = tokenStore.get(getrollnotoken);
      try {
        const alumniData = await Register.findOne(
          { rollno: getrollno, status: "Approved" },
          {
            profileimg: 1,
            name: 1,
            rollno: 1,
            skill: 1,
            branch: 1,
            batch: 1,
            mobno: 1,
            mailid: 1,
            address: 1,
            cgpa: 1,
          }
        );

        if (!alumniData) {
          return res.status(404).render("viewalumni", {
            warn: "Alumni Not Found",
          });
        }

        const CompleteAddress = `${alumniData.address.village}, ${alumniData.address.post}, ${alumniData.address.block}, ${alumniData.address.district}, ${alumniData.address.pincode}, ${alumniData.address.state}`;

        res.render("viewalumni", {
          profileimg: alumniData.profileimg,
          name: alumniData.name,
          rollno: alumniData.rollno,
          skill: alumniData.skill,
          cgpa: alumniData.cgpa,
          branch: alumniData.branch,
          batch: alumniData.batch,
          mobno: alumniData.mobno,
          mailid: alumniData.mailid,
          CompleteAddress: CompleteAddress,
        });
      } catch (err) {
        console.error("Error fetching alumni data:", err);
        res.status(500).render("viewalumni", {
          warn: "Server Error , PEC : EFD ",
        });
      }
    } else {
      return res.status(404).render("viewalumni", {
        warn: "Server Error , PEC : CNTGCK",
      });
    }
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//
//
//

app.get("/viewcomplaints", async (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    const complaints = await Complaint.find({ rollno: rollno });
    res.render("viewcomplaintsalumni", {
      complaints: complaints,
    });
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//
//
//
//

app.get("/registercomplaint", (req, res) => {
  res.render("registercomplaint");
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
  }
});

app.post("/registercomplaint", async (req, res) => {
  const token = req.cookies.userToken;
  const { complaintTitle, complaintDetails, complaintType } = req.body;

  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    try {
      const newComplaint = new Complaint({
        rollno: rollno,
        title: complaintTitle,
        complaint: complaintDetails,
        issuetype: complaintType,
        status: "Pending",
      });

      // Save the new complaint
      const complaintscount = await Complaint.countDocuments({
        rollno: rollno,
        status: "Pending",
      });

      if (complaintscount < 2) {
        const registered = await newComplaint.save();
        const complaintId = registered._id;

        res.status(201).render("registercomplaint", {
          success: `Success! CID: ${complaintId}`,
        });
      } else {
        res.status(201).render("registercomplaint", {
          warn: "Cannot register more than 2 active complaints. Try after resolving older ones.",
        });
      }

      // Get the complaint ID from the registered object
    } catch (err) {
      console.log(err);
      res.status(201).render("registercomplaint", {
        warn: "Unable to register Complaint.",
      });
    }
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//
//
//
//

app.get("/post", (req, res) => {
  const token = req.cookies.userToken;

  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    res.render("post");
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});


app.post("/post", uploadpost.array("postimg"), async (req, res) => {
  const token = req.cookies.userToken;
  const { postObj, posthead } = req.body;

  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    let postPath = null;

    try {
      if (req.files && req.files.length > 0) {
        const uploadedFile = req.files[0];
        const tempPath = uploadedFile.path; 
        const timestamp = Date.now();
        const extname = path.extname(uploadedFile.originalname).toLowerCase();
        const newFilename = `${rollno}-${timestamp}${extname}`;
        const destPath = path.join(__dirname, "/uploads/posts/", newFilename);

        await sharp(tempPath)
          .jpeg({ quality: 65 })  // Compress with 75% quality
          .toFile(destPath);      // Save to the destination path

        fs.unlink(tempPath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });

        postPath = `/uploads/posts/${newFilename}`;
      }

      const newPost = new Post({
        rollno: rollno,
        dateandtime: getTime(),
        head: posthead,
        text: postObj,
        postimage: postPath,
      });

      await newPost.save();

      res.render("post", {
        success: "Posted Successfully",
      });
    } catch (err) {
      console.error("Error creating post:", err);
      res.render("post", {
        warn: "Unable to post. Please try again.",
      });
    }
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//
//
//
//
//

app.get("/deleteaccount", (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    res.render("deletealumni");
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

app.post("/deleteaccount", async (req, res) => {
  const { password, captcha } = req.body;
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    const user = await Register.findOne(
      { rollno: rollno },
      {
        password: 1,
      }
    );
    if (!user) {
      res.render("deletealumni", {
        warn: "Roll no not found !",
      });
    }
    const pass = user.password.trim().replace(/\s+/g, "");
    // const isMatch = await bcrypt.compare(password, OrgPass);
    const isMatch = pass === password;
    if (isMatch && (captcha === "6j4Ab" || captcha === rollno)) {
      const result = await Register.deleteOne({ rollno: rollno });
      const delPost = await Post.deleteMany({ rollno: rollno });
      if (delPost.deletedCount > 0) {
        console.log(`No of posts deleted : ${delPost.deletedCount}`);
      }
      const delComplaint = await Complaint.deleteMany({ rollno: rollno });
      if (delComplaint.deletedCount > 0) {
        console.log(`No of Complaints Deleted : ${delComplaint.deletedCount}`);
      }
      const delQueries = await Query.deleteMany({ rollno: rollno });
      if (delQueries.deletedCount > 0) {
        console.log(`No of Complaints Deleted : ${delQueries.deletedCount}`);
      }
      const delQueryComments = await Query.updateMany(
        { "replies.rollno": rollno },
        { $pull: { replies: { rollno: rollno } } }
      );
      const delPostComments = await Post.updateMany(
        { "comments.author": rollno },
        { $pull: { comments: { author: rollno } } }
      );

      const postsDir = path.join(__dirname, "./uploads/posts/");

      try {
        const files = await fs.promises.readdir(postsDir);

        for (const file of files) {
          if (
            file.startsWith(rollno.slice(0, 8)) ||
            file.startsWith(rollno.slice(0, 7))
          ) {
            const filePath = path.join(postsDir, file);

            try {
              await fs.promises.unlink(filePath);
              console.log(`Deleted file: ${filePath}`);
            } catch (err) {
              console.error(`Error deleting file: ${filePath}`, err);
            }
          }
        }
      } catch (err) {
        console.error(`Error reading directory: ${postsDir}`, err);
      }

      if (result.deletedCount === 1) {
        const supportedExtensions = [".jpg", ".jpeg", ".png"];
        for (const ext of supportedExtensions) {
          const filePath = path.join(
            "./uploads/profileimgs/",
            `${rollno}-profile_img${ext}`
          );

          try {
            if (
              await fs.promises
                .access(filePath, fs.constants.F_OK)
                .then(() => true)
                .catch(() => false)
            ) {
              await fs.promises.unlink(filePath);
              break;
            } else {
              console.log(`File not found: ${filePath}`);
            }
          } catch (unlinkErr) {
            console.error(`Error deleting ${filePath}:`, unlinkErr);
          }
        }
        return res.status(200).render("deletealumni", {
          success: "Deleted Successfully",
        });
      } else {
        return res.status(500).render("deletealumni", {
          warn: "Failed to delete",
        });
      }
    } else {
      return res.status(500).render("deletealumni", {
        warn: "Invalid Password or Captcha",
      });
    }
  }
});

//
//
//
//
//
//
//
//
//
//
//
//
app.post("/post/:id/addcomment", async (req, res) => {
  try {
    const token = req.cookies.userToken;
    if (tokenStore.has(token)) {
      const rollno = tokenStore.get(token);
      const postId = req.params.id;
      const { commentText } = req.body;
      const dateandtime = getTime();
      const newComment = {
        text: commentText,
        author: rollno,
        dateandtime: dateandtime,
      };
      const post = await Post.findById(postId);
      post.comments.push(newComment);

      await post.save();
      res.redirect("/home");
    } else {
      res.render("loginalumni", {
        warn: "Login to access that page.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

//
//
//
//
//
//
//
//
//
//
//

app.get("/actions", (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    res.render("actions");
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//
//
//
//

app.get("/update", async (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    const datas = await Register.findOne(
      { rollno: rollno },
      {
        mobno: 1,
        mailid: 1,
        address: 1,
        skill: 1,
        servicetype: 1,
        company: 1,
      }
    );
    res.render("updatealumni", {
      currentSkills: datas.skill,
      currentMobile: datas.mobno,
      currentMail: datas.mailid,
      currentDistrict: datas.address.district,
      currentState: datas.address.state,
      currentBlock: datas.address.block,
      currentVillage: datas.address.village,
      currentPincode: datas.address.pincode,
      currentPost: datas.address.post,
      currentService: datas.servicetype,
      currentCompany: datas.company,
    });
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
app.post("/update", async (req, res) => {
  const {
    newSkills,
    newPassword,
    newMobile,
    newMobileAccess,
    newMail,
    newDistrict,
    newState,
    newBlock,
    newVillage,
    newPincode,
    newPost,
    newService,
    customService,
    newCompany,
    customCompany
  } = req.body;

  const token = req.cookies.userToken;

  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    const user = await Register.findOne({ rollno });

    if (user) {
      const updateFields = {};

      if (newPassword) {
        const newPass = newPassword.trim().replace(/\s+/g, "");
        updateFields.password = newPass;
      }

      if (newSkills && newSkills !== user.skill) {
        updateFields.skill = newSkills.toUpperCase();
      }

      if (newMobile && newMobile !== user.mobno.mobno) {
        updateFields["mobno.mobno"] = newMobile;
      }

      if (newMobileAccess && newMobileAccess !== user.mobno.access) {
        updateFields["mobno.access"] = newMobileAccess;
      }

      if (newMail && newMail !== user.mailid) {
        updateFields.mailid = newMail.toLowerCase();
      }

      if (newDistrict && newDistrict !== user.address?.district) {
        updateFields["address.district"] = newDistrict.toUpperCase();
      }

      if (newState && newState !== user.address?.state) {
        updateFields["address.state"] = newState.toUpperCase();
      }

      if (newBlock && newBlock !== user.address?.block) {
        updateFields["address.block"] = newBlock.toUpperCase();
      }

      if (newVillage && newVillage !== user.address?.village) {
        updateFields["address.village"] = newVillage.toUpperCase();
      }

      if (newPincode && newPincode !== user.address?.pincode) {
        updateFields["address.pincode"] = newPincode;
      }

      // Handle Service Type
      if (newService === "OTHER" && customService) {
        updateFields.servicetype = customService.toUpperCase();
      } else if (newService && newService !== user.servicetype) {
        updateFields.servicetype = newService.toUpperCase();
      }

      // Handle Company Name
      if (newCompany === "OTHER" && customCompany) {
        updateFields.company = customCompany.toUpperCase();
      } else if (newCompany && newCompany !== user.company) {
        updateFields.company = newCompany.toUpperCase();
      }

      if (newPost && newPost !== user.address?.post) {
        updateFields["address.post"] = newPost.toUpperCase();
      }

      if (Object.keys(updateFields).length > 0) {
        await Register.updateOne({ rollno }, { $set: updateFields });

        res.render("updatealumni", {
          success: "Updated Successfully",
        });
      } else {
        res.render("updatealumni", {
          warn: "No changes detected",
        });
      }
    } else {
      res.render("loginalumni", {
        warn: "Login to access that page.",
      });
    }
  }
});


//
//
//
//
//
//
//
//

app.get("/instadmin", (req, res) => {
  res.render("logininstadmin");
});
app.post("/instadmin", async (req, res) => {
  try {
    const { iadmid, iadmpassword } = req.body;
    const admid = iadmid.trim().replace(/\s+/g, "");
    const iadm = await AdmRegister.findOne({
      empId: admid,
      password: iadmpassword,
    });
    if (!iadm) {
      return res.render("logininstadmin", {
        warn: `Invalid Admin Credentials`,
      });
    } else {
      const token = crypto.randomBytes(16).toString("hex");
      tokenStore.set(token, admid);
      res.cookie("instAdmToken", token, { maxAge: 3600000, httpOnly: true });
      res.redirect("/instadmin/actions");
    }
  } catch (err) {
    console.log(err);
    res.render("logininstadmin", {
      warn: "Unable to login.",
    });
  }
});
//
//
//
//
//
//
//
//

app.get("/instadmin/actions", (req, res) => {
  const token = req.cookies.instAdmToken;
  if (tokenStore.has(token)) {
    res.render("instadminactions");
  }
});

//
//
//
//
//
//
//
//

app.get("/instadmin/requests", async (req, res) => {
  try {
    const token = req.cookies.instAdmToken;

    if (tokenStore.has(token)) {
      const AdmToken = tokenStore.get(token);
      const InstAdm = await AdmRegister.findOne({ empId: AdmToken });

      const users = await Register.find({ status: "Pending" });

      res.render("managereginstadmin", { data: users });
    } else {
      res.render("logininstadmin", {
        warn: "Login to access that page.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post("/approve", async (req, res) => {
  try {
    const token = req.cookies.instAdmToken;
    if (tokenStore.has(token)) {
      const AdmToken = tokenStore.get(token);
      const { rollno } = req.body;

      const updated = await Register.updateOne(
        { rollno: rollno },
        { $set: { status: "Approved", appby: AdmToken } }
      );

      if (updated.modifiedCount > 0) {
        console.log(`Approved user with rollno: ${rollno}`);
        res.redirect("/instadmin/requests");
      } else {
        console.log(`No record found for r  ollno: ${rollno}`);
        res.redirect("/instadmin/requests");
      }
    } else {
      res.render("logininstadmin", {
        warn: "Login to access that page.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
app.post("/reject", async (req, res) => {
  try {
    const { rollno, remark } = req.body;
    const result = await Register.deleteOne({ rollno: rollno });

    if (result.deletedCount === 1) {
      console.log(`User with rollno: ${rollno} has been rejected.`);

      const supportedExtensions = [".jpg", ".jpeg", ".png"];

      for (const ext of supportedExtensions) {
        const filePath = path.join(
          "./uploads/profileimgs/",
          `${rollno}-profile_img${ext}`
        );

        try {
          const fileExists = await fs.promises
            .access(filePath, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false);

          if (fileExists) {
            await fs.promises.unlink(filePath);
            console.log(`Deleted profile image: ${filePath}`);
            break;
          } else {
            console.log(`File not found: ${filePath}`);
          }
        } catch (unlinkErr) {
          console.error(`Error deleting ${filePath}:`, unlinkErr);
        }
      }

      res.redirect("/instadmin/requests");
    } else {
      console.log(`No record found for rollno: ${rollno}`);
      res.redirect("/instadmin/requests");
    }
  } catch (err) {
    console.error(`Error rejecting user with rollno: ${rollno}:`, err);
    res.status(500).send("Server Error");
  }
});
//
//
//
//
//
//
//
//
//
//
//
//
//

app.get("/instadmin/replycomplaints", async (req, res) => {
  const token = req.cookies.instAdmToken;

  if (tokenStore.has(token)) {
    const AdmToken = tokenStore.get(token);
    const complaints = await Complaint.find({ issuetype: "Details Related" });
    res.render("instadminreplycomp", {
      complaints: complaints,
    });
  } else {
    res.render("logininstadmin", {
      warn: "Login to access that page.",
    });
  }
});
app.post("/instadmin/replycomplaints", async (req, res) => {
  const token = req.cookies.instAdmToken;
  const { complaintId, rollno, response, complaintStatus } = req.body;

  if (tokenStore.has(token)) {
    const iadmid = tokenStore.get(token);
    try {
      const updatedComplaint = await Complaint.findOneAndUpdate(
        { _id: complaintId, rollno: rollno },
        {
          $set: { response: response, status: complaintStatus, respby: iadmid },
        }
      );

      if (!updatedComplaint) {
        return res.status(404).send("Complaint not found");
      }

      res.redirect("/instadmin/replycomplaints");
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.render("logininstadmin", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//
//
//
//
//
//


app.get('/instadmin/viewcomplaints', async (req, res) => {
  const token = req.cookies.instAdmToken;

  if (tokenStore.has(token)) {
    const iadmid = tokenStore.get(token);
    const complaints = await InstComplaint.find({ empId: iadmid })
    res.render('viewcomplaintsinstadmin', {
      complaints: complaints
    })
  }
  else {
    res.render('logininstadmin', {
      warn: "Login to Access that Page"
    })
  }
})



//
//
//
//
//
//
//
//
//
//

app.get("/adminregistercomplaint", (req, res) => {
  const token = req.cookies.instAdmToken;
  if (tokenStore.has(token)) {
    const iadmid = tokenStore.get(token);
    res.render("registercomplaintinstadmin");
  }
});
app.post("/adminregistercomplaint", async (req, res) => {
  const token = req.cookies.instAdmToken;
  if (tokenStore.has(token)) {
    const iadmid = tokenStore.get(token);
    const { complaintDetails } = req.body

    const newInstComplaint = new InstComplaint({
      empId: iadmid,
      complaint: complaintDetails,
      status: "Pending",
    });

    // Save the new complaint
    const complaintscount = await InstComplaint.countDocuments({
      empId: iadmid,
      status: "Pending",
    });

    if (complaintscount < 2) {
      const registered = await newInstComplaint.save();
      const complaintId = registered._id;

      res.status(201).render("registercomplaintinstadmin", {
        success: `Success! CID: ${complaintId}`,
      });
    } else {
      res.status(201).render("registercomplaintinstadmin", {
        warn: "Cannot register more than 2 active complaints. Try after resolving older ones.",
      });
    }
  }
});
//
//
//
//
//
//
//
//
//
//

app.get("/alumnisorted", async (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const users = await Register.find({});
    users.sort((a, b) => parseInt(b.batch) - parseInt(a.batch)); // Sorting by batch (descending)
    res.render("alumnissort", { users });
  } else {
    res.render("loginalumni", { warn: "Login to access that page." });
  }
});

app.post('/alumnisorted', async (req, res) => {
  const token = req.cookies.userToken;

  if (tokenStore.has(token)) {
    if (req.body) {
      const { field, value } = req.body;
      let users = []; // Define users array before conditions

      if (field === 'cname') {
        const val = value.toUpperCase();
        users = await Register.find(
          { company: val },
          { profileimg: 1, name: 1, rollno: 1, branch: 1, batch: 1, skill: 1, mobno: 1, mailid: 1, address: 1, cgpa: 1, servicetype: 1, company: 1 }
        );
      }
      else if (field === 'stype') {
        const val = value.toUpperCase();
        users = await Register.find(
          { servicetype: val },
          { profileimg: 1, name: 1, rollno: 1, branch: 1, batch: 1, skill: 1, mobno: 1, mailid: 1, address: 1, cgpa: 1, servicetype: 1, company: 1 }
        );
      }
      else if (field === 'state') {
        const val = value.toUpperCase();
        users = await Register.find(
          { "address.state": val },
          { profileimg: 1, name: 1, rollno: 1, branch: 1, batch: 1, skill: 1, mobno: 1, mailid: 1, address: 1, cgpa: 1, servicetype: 1, company: 1 }
        );
      }
      else if (field === "cgpa") {
        const cgpaValue = parseFloat(value);
        if (!isNaN(cgpaValue)) {
          users = await Register.find(
            { cgpa: { $gt: cgpaValue } },
            { profileimg: 1, name: 1, rollno: 1, branch: 1, batch: 1, skill: 1, mobno: 1, mailid: 1, address: 1, cgpa: 1, servicetype: 1, company: 1 }
          );
        }
      }
      else if (field === 'skill') {
        const val = value.toUpperCase();
        users = await Register.find(
          { skill: val },
          { profileimg: 1, name: 1, rollno: 1, branch: 1, batch: 1, skill: 1, mobno: 1, mailid: 1, address: 1, cgpa: 1, servicetype: 1, company: 1 }
        );
      }
      else if (field === 'batch') {
        users = await Register.find(
          { batch: value },
          { profileimg: 1, name: 1, rollno: 1, branch: 1, batch: 1, skill: 1, mobno: 1, mailid: 1, address: 1, cgpa: 1, servicetype: 1, company: 1 }
        );
      }
      else if (field === "branch") {
        const branchValue = value.toUpperCase();
        users = await Register.find(
          { branch: branchValue },
          { profileimg: 1, name: 1, rollno: 1, branch: 1, batch: 1, skill: 1, mobno: 1, mailid: 1, address: 1, cgpa: 1, servicetype: 1, company: 1 }
        );
      }
      else if (field === "all") {
        users = await Register.find({});
      }

      if (users.length === 0) {
      }

      users.sort((a, b) => parseInt(b.batch) - parseInt(a.batch));

      res.render("alumnissort", { users });
    }
    else {
      const users = await Register.find({});
      users.sort((a, b) => parseInt(b.batch) - parseInt(a.batch));
      res.render("alumnissort", { users });
    }
  } else {
    res.render("loginalumni", { warn: "Login to access that page." });
  }
});


//
//
//
//
//

app.get("/raisequery", (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    res.render("raisequery");
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});
app.post("/raisequery", async (req, res) => {
  const { query } = req.body;
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    const mydata = await Register.find({ rollno: rollno }, { name: 1 });
    const name = mydata[0].name;
    const registerQuery = new Query({
      query: query,
      rollno: rollno,
      name: name,
    });
    const registered = await registerQuery.save();
    console.log(registered);
    res.render("raisequery", {
      success: "Query Raised Successfully.",
    });
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

app.get("/myqueries", async (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    const queries = await Query.find(
      { rollno: rollno },
      {
        query: 1,
        replies: 1,
      }
    );

    res.render("myqueries", {
      queries: queries,
    });
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//

app.get("/viewqueries", async (req, res) => {
  const token = req.cookies.userToken;
  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);
    const queries = await Query.find({
      rollno: { $ne: rollno },
    });

    res.render("viewqueries", {
      queries: queries,
    });
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
app.post("/addqueryresponse", async (req, res) => {
  const { comment, queryId } = req.body;
  const token = req.cookies.userToken;

  if (tokenStore.has(token)) {
    const rollno = tokenStore.get(token);

    const user = await Register.findOne({ rollno: rollno });

    if (!user) {
      return res.render("Warning", {
        warn: "User not found.",
      });
    }
    await Query.findByIdAndUpdate(queryId, {
      $push: {
        replies: {
          name: user.name,
          rollno: rollno,
          reply: comment,
        },
      },
    });
    res.redirect("/viewqueries");
  } else {
    res.render("loginalumni", {
      warn: "Login to access that page.",
    });
  }
});

//
//
//
//
//
//
//
//

app.get("/headadmin", (req, res) => {
  res.render("loginheadadmin");
});
app.post("/headadmin", async (req, res) => {
  try {
    const { hadmid, hadmpassword } = req.body;
    const admid = hadmid.trim().replace(/\s+/g, "");
    const hadm = await HeadRegister.findOne({
      empId: admid,
      password: hadmpassword,
    });
    if (!hadm) {
      return res.render("loginheadadmin", {
        warn: `Invalid Admin Credentials`,
      });
    } else {
      const token = crypto.randomBytes(16).toString("hex");
      tokenStore.set(token, admid);
      res.cookie("headAdmToken", token, { maxAge: 3600000, httpOnly: true });
      res.redirect("/headadmin/actions");
    }
  } catch (err) {
    console.log(err);
    res.render("loginheadadmin", {
      warn: "Unable to login.",
    });
  }
});

//
//
//
//
//
//
//
//
//
//
//
//
//
//

app.get("/headadmin/actions/", (req, res) => {
  const token = req.cookies.headAdmToken;
  if (tokenStore.has(token)) {
    res.render("headadminactions");
  }
});
//
//
//
//
//
//
//
//
//
//
app.get("/headadmin/addinstadm", (req, res) => {
  const token = req.cookies.headAdmToken;
  if (tokenStore.has(token)) {
    res.render("addinstadmins");
  }
});
app.post("/headadmin/addinstadm", async (req, res) => {
  const token = req.cookies.headAdmToken;
  if (tokenStore.has(token)) {
    const { name, employeeid, password, mobile, email, remark } = req.body;
    const registerNewInstAdmin = new AdmRegister({
      name: name.trim(),
      empId: employeeid.trim(),
      password: password.trim(),
      mobno: mobile.trim(),
      mailid: email.trim(),
      remark: remark,
    });

    const registered = await registerNewInstAdmin.save();

    if (registered) {
      res.render("addinstadmins", {
        success: "Institution Member Added Successfully.",
      });
    } else {
      res.render("addinstadmins", {
        warn: "Somethinh went wrong.",
      });
    }
  }
});
//
//
//
//
//
//
//
//
//
//
//
//
//
//
app.get("/headadmin/replycomplaints", async (req, res) => {
  const token = req.cookies.headAdmToken;

  if (tokenStore.has(token)) {
    const AdmToken = tokenStore.get(token);
    const complaints = await Complaint.find({ issuetype: "Account Related" });
    res.render("headadminreplycomp", {
      complaints: complaints,
    });
  } else {
    res.render("loginheadadmin", {
      warn: "Login to access that page.",
    });
  }
});
app.post("/headadmin/replycomplaints", async (req, res) => {
  const token = req.cookies.headAdmToken;
  const { complaintId, rollno, response, complaintStatus } = req.body;

  if (tokenStore.has(token)) {
    const hadmid = tokenStore.get(token);
    try {
      const updatedComplaint = await Complaint.findOneAndUpdate(
        { _id: complaintId, rollno: rollno },
        {
          $set: { response: response, status: complaintStatus, respby: hadmid },
        }
      );

      if (!updatedComplaint) {
        return res.status(404).send("Complaint not found");
      }

      res.redirect("/headadmin/replycomplaints");
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.render("loginheadadmin", {
      warn: "Login to access that page.",
    });
  }
});
//
//
//
//
//
//
//
//
//
//
//
//
//
//

app.get("/headadmin/replyinstcomplaints", async (req, res) => {
  const token = req.cookies.headAdmToken;

  if (tokenStore.has(token)) {
    const AdmToken = tokenStore.get(token);
    const complaints = await InstComplaint.find({});
    res.render("headadminreplyinstcomp", {
      complaints: complaints,
    });
  } else {
    res.render("loginheadadmin", {
      warn: "Login to access that page.",
    });
  }
});

app.post("/headadmin/replyinstcomplaints", async (req, res) => {
  const token = req.cookies.headAdmToken;
  const { complaintId, empId, response, complaintStatus } = req.body;

  if (tokenStore.has(token)) {
    const hadmid = tokenStore.get(token);
    try {
      const updatedComplaint = await InstComplaint.findOneAndUpdate(
        { _id: complaintId, empId: empId },
        {
          $set: { response: response, status: complaintStatus, respby: hadmid },
        }
      );

      if (!updatedComplaint) {
        return res.status(404).send("Complaint not found");
      }

      res.redirect("/headadmin/replyinstcomplaints");
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.render("loginheadadmin", {
      warn: "Login to access that page.",
    });
  }
});


//
//
//
//
//
//
//
//
//
//
//
//
app.get("/freeupspace", (req, res) => {
    const directory = path.join(__dirname, "uploads/profileimgs/");
    const token = req.cookies.headAdmToken;

    if (!tokenStore.has(token)) {
        return res.send("Login to access this action.");
    }

    // Read directory using callback-based fs.readdir
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error("Error reading directory:", err);
            return res.render('headadminactions',{warn:"Something went wrong."})
        }

        const tempFiles = files.filter(file => file.startsWith("temp"));

        if (tempFiles.length === 0) {
            return res.render('headadminactions',{success:"No Junk files to free up !"})
        }

        let deletedCount = 0;

        tempFiles.forEach(file => {
            const filePath = path.join(directory, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", file, err);
                } else {
                    deletedCount++;
                    if (deletedCount === tempFiles.length) {
                        res.render('headadminactions',{success:"Space Freed Up ! "})
                    }
                }
            });
        });
    });
});




//
//
//
//
//
//
//
//
//
//
//
//
//
//
app.get("/logout", (req, res) => {
  const token = req.cookies.userToken;

  if (token && tokenStore.has(token)) {
    tokenStore.delete(token);
    res.clearCookie("userToken");
    console.log(`Token ${token} logged out and removed from tokenStore.`);
  }
  res.redirect("/");
});

app.get("/about", (req, res) => {
  res.render("about");
});
//
//
//
//
//
//
//
//

app.get("*", (req, res) => {
  res.render("404");
});

app.listen(port);
