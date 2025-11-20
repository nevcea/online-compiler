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

    private addOutput(data: Buffer | string, isStdout: boolean): void {
        const truncated = isStdout ? this.stdoutTruncated : this.stderrTruncated;
        if (truncated) {
            return;
        }
        const s = data.toString('utf8');
        const bytes = Buffer.byteLength(s, 'utf8');
        const currentBytes = isStdout ? this.stdoutBytes : this.stderrBytes;
        const remaining = this.maxBytes - currentBytes;
        if (remaining <= 0) {
            if (isStdout) {
                this.stdoutTruncated = true;
            } else {
                this.stderrTruncated = true;
            }
            return;
        }
        if (bytes <= remaining) {
            if (isStdout) {
                this.stdout += s;
                this.stdoutBytes += bytes;
            } else {
                this.stderr += s;
                this.stderrBytes += bytes;
            }
        } else {
            const slice = Buffer.from(s, 'utf8').subarray(0, remaining).toString('utf8');
            if (isStdout) {
                this.stdout += slice;
                this.stdoutBytes += remaining;
                this.stdoutTruncated = true;
            } else {
                this.stderr += slice;
                this.stderrBytes += remaining;
                this.stderrTruncated = true;
            }
        }
    }

    addStdout(data: Buffer | string): void {
        this.addOutput(data, true);
    }

    addStderr(data: Buffer | string): void {
        this.addOutput(data, false);
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

