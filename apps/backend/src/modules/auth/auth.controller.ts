import {
  Body,
  Controller,
  Headers,
  Patch,
  Post,
  Request,
  UseGuards,
  Param,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { OTPType, PINType, UserRole } from "../../common/enums/enums";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { VerifyOTPDto } from "./dto/verify-registration.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { extractBearer } from "../../common/utils/auth-util";
import { UserLoginDto } from "./dto/user-login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { PatrolLoginDto } from "./dto/patrol-login.dto";
import { CitizenLoginDto } from "./dto/citizen-login.dto";
import { CitizenRegisterDto, CitizenRegisterFormDto } from "./dto/citizen-register.dto";
import { SetPinDto } from "./dto/set-pin.dto";
import { ConfirmPinResetDto } from "./dto/confirm-pin-reset.dto";
import { IsString, Length, Matches, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

class ChangePinDto {
  @ApiProperty({ example: "1234", description: "Your current PIN" })
  @IsString()
  currentPin: string;

  @ApiProperty({ example: "5678", description: "New 4-6 digit PIN" })
  @IsString()
  @Length(4, 6, { message: "PIN must be 4–6 digits" })
  @Matches(/^\d+$/, { message: "PIN must contain only digits" })
  newPin: string;
}

class RequestPinResetDto {
  @ApiProperty({
    example: "+251911234567",
    description: "Registered phone number",
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ enum: PINType, example: PINType.RESET })
  @IsEnum(PINType)
  type: PINType;
}

class ConfirmPasswordResetDto {
  @ApiProperty({ example: "123456", description: "OTP sent to your phone" })
  @IsString()
  otpCode: string;

  @ApiProperty({ description: "New password" })
  @IsString()
  newPassword: string;
}

@ApiTags("Authentication")
@Controller("auth")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // --------- USER (Dashboard Admin) AUTH FLOW ---------

  @Public()
  @Post("user/login")
  @ApiOperation({
    summary:
      "Login internal user (System Admin/Super Admin) with email or phone + password",
  })
  @ApiResponse({ status: 200, description: "Login successful" })
  async loginUser(@Body() dto: UserLoginDto) {
    return this.authService.userLogin(dto.phoneNumber, dto.password, dto.email);
  }

  @Public()
  @Post("user/pre-login")
  @ApiOperation({ summary: "Check user password status before full login" })
  @ApiResponse({
    status: 200,
    description: "Returns password status and reset token if not set",
  })
  async loginUserPreLogin(@Body() dto: Partial<UserLoginDto>) {
    return this.authService.userPreLogin(dto.email, dto.phoneNumber);
  }

  @Public()
  @Post("user/refresh")
  @ApiOperation({
    summary: "Refresh access token using refresh token (all user types)",
  })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  async refreshUserToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshUserToken(dto.refreshToken);
  }

  @Public()
  @Post("user/verify")
  @ApiOperation({
    summary: "Verify user registration OTP (requires registration token)",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "OTP verified successfully" })
  async verifyUser(
    @Headers("authorization") authHeader: string,
    @Body() dto: VerifyOTPDto,
  ) {
    const token = extractBearer(authHeader);
    return this.authService.verifyUserOTP(token, dto.otpCode, dto.otpType);
  }

  @Public()
  @Post("user/set-password")
  @ApiOperation({
    summary: "Set dashboard user password (requires set-password token)",
  })
  @ApiBearerAuth()
  async setUserPassword(
    @Headers("authorization") authHeader: string,
    @Body() dto: SetPasswordDto,
  ) {
    const token = extractBearer(authHeader);
    return this.authService.setUserPasswordWithToken(token, dto.password);
  }

  @Public()
  @Post("user/password-reset/request")
  @ApiOperation({
    summary: "Request dashboard user password reset OTP (phone-based)",
  })
  async requestUserPasswordReset(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestUserPasswordReset(dto.phoneNumber);
  }

  @Public()
  @Post("user/password-reset/confirm")
  @ApiOperation({
    summary: "Reset dashboard user password using reset token + OTP",
  })
  @ApiBearerAuth()
  async resetUserPassword(
    @Headers("authorization") authHeader: string,
    @Body() dto: ConfirmPasswordResetDto,
  ) {
    const token = extractBearer(authHeader);
    return this.authService.resetUserPasswordWithToken(
      token,
      dto.otpCode,
      dto.newPassword,
    );
  }

  @Patch("user/password/change")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change password for authenticated dashboard user" })
  async changeUserPassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changeUserPassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // --------- PATROL AUTH FLOW ---------

  @Public()
  @Post("patrol/login")
  @ApiOperation({
    summary: "Patrol officer login with phone + PIN (from Patrol App)",
  })
  @ApiResponse({ status: 200, description: "Patrol login successful" })
  async loginPatrol(@Body() dto: PatrolLoginDto) {
    return this.authService.patrolLogin(dto.phoneNumber, dto.pin);
  }

  @Public()
  @Post("patrol/pre-login")
  @ApiOperation({
    summary: "Check patrol PIN status and initiate PIN setting if needed",
  })
  async patrolPreLogin(@Body() dto: { phoneNumber: string }) {
    return this.authService.patrolPreLogin(dto.phoneNumber);
  }

  @Public()
  @Post("patrol/verify")
  @ApiOperation({
    summary: "Verify patrol registration OTP (requires registration token)",
  })
  @ApiBearerAuth()
  async verifyPatrol(
    @Headers("authorization") authHeader: string,
    @Body() dto: VerifyOTPDto,
  ) {
    const token = extractBearer(authHeader);
    return this.authService.verifyMobileOTP(token, dto.otpCode, dto.otpType);
  }

  @Public()
  @Post("patrol/resend-otp")
  @ApiOperation({ summary: "Resend patrol registration OTP" })
  @ApiBearerAuth()
  async resendPatrolOTP(
    @Headers("authorization") authHeader: string,
    @Body() dto: { otpType: OTPType },
  ) {
    const token = extractBearer(authHeader);
    return this.authService.resendMobileOTP(token, dto.otpType);
  }

  @Public()
  @Post("patrol/set-pin")
  @ApiOperation({
    summary: "Set patrol officer PIN (requires set-pin token)",
  })
  @ApiBearerAuth()
  async setPatrolPin(
    @Headers("authorization") authHeader: string,
    @Body() dto: SetPinDto,
  ) {
    const token = extractBearer(authHeader);
    return this.authService.setMobilePinWithToken(token, dto.pin);
  }

  @Public()
  @Post("patrol/pin-reset/request")
  @ApiOperation({ summary: "Patrol: Request PIN reset OTP via SMS" })
  @ApiResponse({ status: 200, description: "OTP sent to phone" })
  async requestPatrolPinReset(@Body() dto: RequestPinResetDto) {
    return this.authService.requestPinReset(dto.phoneNumber, "patrol", dto.type);
  }

  @Public()
  @Post("patrol/pin-reset/confirm")
  @ApiOperation({ summary: "Patrol: Confirm PIN reset with OTP + reset token" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "PIN reset successfully" })
  async confirmPatrolPinReset(
    @Headers("authorization") authHeader: string,
    @Body() dto: ConfirmPinResetDto,
  ) {
    const token = extractBearer(authHeader);
    return this.authService.confirmPinReset(token, dto.otpCode, dto.newPin);
  }

  // --------- CITIZEN AUTH FLOW ---------

  @Public()
  @Post("citizen/register")
  @ApiOperation({
    summary: "Citizen self-registration with phone + PIN (from Citizen App)",
  })
  @ApiResponse({ status: 201, description: "Citizen registered successfully" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: CitizenRegisterFormDto })
  @UseInterceptors(FileInterceptor("profileImage", { storage: memoryStorage() }))
  async registerCitizen(
    @Body() dto: CitizenRegisterDto,
    @UploadedFile() file?: any,
  ) {
    return this.authService.citizenRegister(
      dto.fullName,
      dto.phoneNumber,
      file,
    );
  }

  @Public()
  @Post("citizen/login")
  @ApiOperation({
    summary: "Citizen login with phone + PIN (from Citizen App)",
  })
  @ApiResponse({ status: 200, description: "Citizen login successful" })
  async loginCitizen(@Body() dto: CitizenLoginDto) {
    return this.authService.citizenLogin(dto.phoneNumber, dto.pin);
  }

  @Public()
  @Post("citizen/pre-login")
  @ApiOperation({
    summary: "Check citizen PIN status and initiate PIN setting if needed",
  })
  async citizenPreLogin(@Body() dto: { phoneNumber: string }) {
    return this.authService.citizenPreLogin(dto.phoneNumber);
  }

  @Public()
  @Post("citizen/verify")
  @ApiOperation({
    summary: "Verify citizen registration OTP (requires registration token)",
  })
  @ApiBearerAuth()
  async verifyCitizen(
    @Headers("authorization") authHeader: string,
    @Body() dto: VerifyOTPDto,
  ) {
    const token = extractBearer(authHeader);
    return this.authService.verifyMobileOTP(token, dto.otpCode, dto.otpType);
  }

  @Public()
  @Post("citizen/resend-otp")
  @ApiOperation({ summary: "Resend citizen registration OTP" })
  @ApiBearerAuth()
  async resendCitizenOTP(
    @Headers("authorization") authHeader: string,
    @Body() dto: { otpType: OTPType },
  ) {
    const token = extractBearer(authHeader);
    return this.authService.resendMobileOTP(token, dto.otpType);
  }

  @Public()
  @Post("citizen/set-pin")
  @ApiOperation({
    summary: "Set citizen PIN (requires set-pin token)",
  })
  @ApiBearerAuth()
  async setCitizenPin(
    @Headers("authorization") authHeader: string,
    @Body() dto: SetPinDto,
  ) {
    const token = extractBearer(authHeader);
    return this.authService.setMobilePinWithToken(token, dto.pin);
  }

  @Public()
  @Post("citizen/pin-reset/request")
  @ApiOperation({ summary: "Citizen: Request PIN reset OTP via SMS" })
  @ApiResponse({ status: 200, description: "OTP sent to phone" })
  async requestCitizenPinReset(@Body() dto: RequestPinResetDto) {
    return this.authService.requestPinReset(dto.phoneNumber, "citizen", dto.type);
  }

  @Public()
  @Post("citizen/pin-reset/confirm")
  @ApiOperation({
    summary: "Citizen: Confirm PIN reset with OTP + reset token",
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "PIN reset successfully" })
  async confirmCitizenPinReset(
    @Headers("authorization") authHeader: string,
    @Body() dto: ConfirmPinResetDto,
  ) {
    const token = extractBearer(authHeader);
    return this.authService.confirmPinReset(token, dto.otpCode, dto.newPin);
  }

  // --------- SHARED PIN MANAGEMENT (Admin-controlled) ---------

  @Post("users/:userId/set-pin")
  @Roles(UserRole.SYSTEM_SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Admin sets or resets PIN for a Patrol or Citizen user",
  })
  @ApiResponse({ status: 200, description: "PIN set successfully" })
  async setUserPin(
    @Param("userId") userId: string,
    @Body() dto: SetPinDto,
    @Request() req: any,
  ) {
    return this.authService.setUserPin(req.user.id, userId, dto.pin);
  }

  @Patch("pin/change")
  @Roles(UserRole.PATROL, UserRole.CITIZEN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Change PIN for authenticated patrol or citizen (requires current PIN)",
  })
  @ApiResponse({ status: 200, description: "PIN changed successfully" })
  async changePin(@Body() dto: ChangePinDto, @Request() req: any) {
    // Pass role from the JWT token so the service knows which table to look in
    return this.authService.changePin(
      req.user.id,
      dto.currentPin,
      dto.newPin,
      req.user.role,
    );
  }
}
