# n8n Persistent Storage Migration Plan

## Current Setup Analysis

**Droplet Information:**
- IP: 46.101.189.137
- Region: Frankfurt 1 (fra1)
- Size: s-2vcpu-4gb-intel (2 vCPU, 4GB RAM, 80GB local disk)
- Current disk usage: 32GB / 58GB (56%)

**n8n Configuration:**
- Running in Docker container: `n8n-isolated`
- Image: `n8nio/n8n:latest`
- Uptime: 6 weeks
- URL: https://n8n.lakestrom.com
- Port: 5678

**Data Storage:**
- Docker volume: `root_n8n_data`
- Physical path: `/var/lib/docker/volumes/root_n8n_data/_data`
- Total size: 656MB
  - SQLite database: 614MB
  - Event logs: ~43MB
  - Binary data, git, ssh, nodes folders

**Current Issue:**
- Data is stored on **ephemeral local disk**
- If droplet is destroyed/rebuilt, all n8n data will be lost
- No persistent storage volume attached

---

## Migration Plan

### Step 1: Create Persistent Block Storage Volume
- Size: 10GB (sufficient for current 656MB + plenty of growth)
- Region: fra1 (same as droplet)
- Filesystem: ext4

### Step 2: Attach and Mount Volume
- Attach volume to droplet
- Format with ext4 filesystem
- Mount at: `/mnt/n8n-data`
- Add to `/etc/fstab` for automatic mounting on reboot

### Step 3: Stop n8n Service
```bash
cd /root
docker-compose down
```
**Expected downtime: 2-3 minutes**

### Step 4: Migrate Data
```bash
# Copy all data to persistent volume
cp -av /var/lib/docker/volumes/root_n8n_data/_data/* /mnt/n8n-data/

# Verify data integrity
ls -lah /mnt/n8n-data/
du -sh /mnt/n8n-data/
```

### Step 5: Update docker-compose.yml
**Change from:**
```yaml
volumes:
  - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

**To:**
```yaml
volumes:
  - /mnt/n8n-data:/home/node/.n8n
```

### Step 6: Start n8n and Test
```bash
docker-compose up -d
docker logs -f n8n-isolated
```

### Step 7: Verify Service
- Check container is running: `docker ps`
- Test web access: https://n8n.lakestrom.com
- Verify workflows are intact
- Test a simple workflow execution

---

## Rollback Plan

If anything goes wrong:

```bash
# Stop container
docker-compose down

# Revert docker-compose.yml to original configuration
git checkout docker-compose.yml  # or manually restore

# Start with old volume
docker-compose up -d
```

**Original data will remain untouched in:**
`/var/lib/docker/volumes/root_n8n_data/_data`

---

## Safety Measures

1. ✅ Original data stays in place as backup
2. ✅ Only copying data (no moving/deleting)
3. ✅ Can rollback in < 1 minute
4. ✅ Minimal downtime (2-3 minutes)
5. ✅ No configuration changes to n8n itself
6. ✅ Block storage is in same region (no latency issues)

---

## Post-Migration

**After 24-48 hours of successful operation:**
- Old Docker volume can be removed: `docker volume rm root_n8n_data`
- This will free up 656MB on local disk

**Ongoing Benefits:**
- Data persists even if droplet is destroyed
- Can resize volume if needed
- Can snapshot volume for backups
- Easier migration to new droplets (just reattach volume)

---

## Cost Impact

**Block Storage Pricing:**
- 10GB volume: $1.00/month
- Negligible compared to droplet cost ($28/month)

---

## Risks Assessment

**Risk Level: LOW** ⚠️

**Why?**
1. Non-destructive operation (copying, not moving)
2. Original data preserved as backup
3. Quick rollback available
4. Tested procedure (standard Docker volume migration)
5. Small data size (656MB = quick copy)

**Potential Issues:**
- Volume attachment issues → Rollback to original setup
- Permission errors → Fix with `chown 1000:1000 /mnt/n8n-data`
- Mount issues → Check `/etc/fstab` and remount

---

## Execution Timeline

1. **Create volume**: 1 minute
2. **Attach & format**: 2 minutes
3. **Mount & fstab**: 1 minute
4. **Stop n8n**: 10 seconds
5. **Copy data**: 1 minute (656MB)
6. **Update compose**: 30 seconds
7. **Start & verify**: 1 minute

**Total estimated time: ~7 minutes**
**Service downtime: ~3 minutes**

---

## Ready to Proceed?

This plan has been carefully designed to:
- ✅ Minimize risk
- ✅ Minimize downtime
- ✅ Provide easy rollback
- ✅ Preserve all data

**Before proceeding, I will:**
1. Create a snapshot of the current docker-compose.yml
2. Document the exact commands to be executed
3. Execute step-by-step with verification at each stage
4. Not proceed to next step unless previous step succeeded

**Would you like me to proceed with this migration?**
