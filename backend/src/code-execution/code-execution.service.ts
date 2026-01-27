import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExecuteCodeDto } from './dto/execute-code.dto';

interface Judge0Submission {
    source_code: string;
    language_id: number;
    stdin?: string;
}

interface Judge0Result {
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    message: string | null;
    status: {
        id: number;
        description: string;
    };
    time: string | null;
    memory: number | null;
}

@Injectable()
export class CodeExecutionService {
    private readonly apiUrl: string;
    private readonly apiKey: string;

    constructor(private configService: ConfigService) {
        this.apiUrl = this.configService.get('JUDGE0_API_URL') || 'https://ce.judge0.com';
        this.apiKey = this.configService.get('JUDGE0_API_KEY') || '';
    }

    async executeCode(dto: ExecuteCodeDto): Promise<any> {
        if (!this.apiKey) {
            throw new HttpException(
                'Judge0 API key not configured. Please add JUDGE0_API_KEY to .env',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        try {
            // Create submission
            const submission: Judge0Submission = {
                source_code: Buffer.from(dto.sourceCode).toString('base64'),
                language_id: dto.languageId,
                stdin: dto.stdin ? Buffer.from(dto.stdin).toString('base64') : undefined,
            };

            // Build headers - use X-Auth-Token for official Judge0 CE API
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add auth token if provided
            if (this.apiKey) {
                headers['X-Auth-Token'] = this.apiKey;
            }

            // Submit code for execution
            const createResponse = await fetch(`${this.apiUrl}/submissions?base64_encoded=true&wait=true`, {
                method: 'POST',
                headers,
                body: JSON.stringify(submission),
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                console.error('Judge0 API error:', errorText);
                throw new HttpException(
                    `Code execution failed: ${createResponse.statusText}`,
                    HttpStatus.BAD_GATEWAY,
                );
            }

            const result: Judge0Result = await createResponse.json();

            // Decode base64 outputs
            return {
                stdout: result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf-8') : null,
                stderr: result.stderr ? Buffer.from(result.stderr, 'base64').toString('utf-8') : null,
                compileOutput: result.compile_output ? Buffer.from(result.compile_output, 'base64').toString('utf-8') : null,
                message: result.message,
                status: result.status,
                time: result.time,
                memory: result.memory,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('Code execution error:', error);
            throw new HttpException(
                'Failed to execute code',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // Get available languages
    getLanguages() {
        return [
            { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
            { id: 71, name: 'Python (3.8.1)' },
            { id: 62, name: 'Java (OpenJDK 13.0.1)' },
            { id: 54, name: 'C++ (GCC 9.2.0)' },
            { id: 50, name: 'C (GCC 9.2.0)' },
            { id: 74, name: 'TypeScript (3.7.4)' },
            { id: 72, name: 'Ruby (2.7.0)' },
            { id: 68, name: 'PHP (7.4.1)' },
            { id: 60, name: 'Go (1.13.5)' },
            { id: 78, name: 'Kotlin (1.3.70)' },
        ];
    }
}
