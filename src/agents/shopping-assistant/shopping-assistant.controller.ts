import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ShoppingAssistantService } from './shopping-assistant.service';

@Controller('agents/shopping-assistant')
export class ShoppingAssistantController {
  constructor(private readonly assistantService: ShoppingAssistantService) {}

  @Post('chat')
  async chat(
    @Body('sessionId') sessionId: string,
    @Body('message') message: string,
    @Body('userId') userId?: string,
  ) {
    if (!sessionId || !message) {
      return {
        error: 'sessionId and message are required',
      };
    }

    const response = await this.assistantService.chat(
      sessionId,
      message,
      userId,
    );

    return {
      success: true,
      response,
      sessionId,
    };
  }

  @Get('conversation/:sessionId')
  getConversation(@Param('sessionId') sessionId: string) {
    const conversation = this.assistantService.getConversation(sessionId);

    if (!conversation) {
      return {
        success: false,
        message: 'Conversation not found',
      };
    }

    return {
      success: true,
      conversation,
    };
  }

  @Post('conversation/:sessionId/clear')
  clearConversation(@Param('sessionId') sessionId: string) {
    this.assistantService.clearConversation(sessionId);

    return {
      success: true,
      message: 'Conversation cleared',
    };
  }

  @Get('faq')
  async getFAQ() {
    const faq = await this.assistantService.getFAQ();

    return {
      success: true,
      faq,
    };
  }
}
