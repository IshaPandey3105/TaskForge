import mongoose,{Schema} from "mongoose";
import{AvailableUserRoles,UserRolesEnum} from "../utils/constant.js"

const projectMemberSchema=new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    project:{
        type:Schema.Types.ObjectId,
        ref:"Project",
        required:true,
    },
    role:{
        type:String,
        enum:AvailableUserRoles,  // when we need array
        default : UserRolesEnum.MEMBER,  // when we need value
    },
},{timeStamps:true});
export const ProjectMember=mongoose.model("ProjectMember",projectMemberSchema)