export class OutputCollector {
    private maxBytes: number;
    private stdout: string;
    private stderr: string;
    private stdoutBytes: number;
    private stderrBytes: number;
    private stdoutTruncated: boolean;
    private stderrTruncated: boolean;

    constructor(maxBytes: number) {
        this.maxBytes = maxBytes;
        this.stdout = '';
        this.stderr = '';
        this.stdoutBytes = 0;
        this.stderrBytes = 0;
        this.stdoutTruncated = false;
        this.stderrTruncated = false;
    }

    addStdout(data: Buffer | string): void {
        if (this.stdoutTruncated) {
            return;
        }
        const s = data.toString('utf8');
        const bytes = Buffer.byteLength(s, 'utf8');
        const remaining = this.maxBytes - this.stdoutBytes;
        if (remaining <= 0) {
            this.stdoutTruncated = true;
            return;
        }
        if (bytes <= remaining) {
            this.stdout += s;
            this.stdoutBytes += bytes;
        } else {
            const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
            this.stdout += slice;
            this.stdoutBytes += remaining;
            this.stdoutTruncated = true;
        }
    }

    addStderr(data: Buffer | string): void {
        if (this.stderrTruncated) {
            return;
        }
        const s = data.toString('utf8');
        const bytes = Buffer.byteLength(s, 'utf8');
        const remaining = this.maxBytes - this.stderrBytes;
        if (remaining <= 0) {
            this.stderrTruncated = true;
            return;
        }
        if (bytes <= remaining) {
            this.stderr += s;
            this.stderrBytes += bytes;
        } else {
            const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
            this.stderr += slice;
            this.stderrBytes += remaining;
            this.stderrTruncated = true;
        }
    }

    getFinalOutput(): { stdout: string; stderr: string } {
        let stdout = this.stdout;
        let stderr = this.stderr;
        if (this.stdoutTruncated) {
            stdout += '\n[truncated]';
        }
        if (this.stderrTruncated) {
            stderr += '\n[truncated]';
        }
        return { stdout, stderr };
    }
}

